import { SlashCommandBuilder, ButtonBuilder } from "@discordjs/builders";
import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonStyle,
    PermissionsBitField,
    AutocompleteInteraction,
    GuildMember,
    StringSelectMenuInteraction,
    ChatInputCommandInteraction,
    ComponentType,
} from "discord.js";
import { GuildQueue, QueryType, Track, useMainPlayer } from "discord-player";

import isUrl from "./../../utils/isUrl";
import MyClient from "../../utils/MyClient";
import { COLORS } from "../../utils/constants";
import BaseCommand from "../../utils/BaseCommand";
import Like from "../playlist/like";

export default class Play extends BaseCommand {
    constructor() {
        super();
    }

    data = new SlashCommandBuilder()
        .setName("play")
        .setDescription("plays a song from youtube or spotify")
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription("a search term, share link, or URL of the song")
                .setRequired(true)
                .setAutocomplete(true)
        );

    async autocomplete(interaction: AutocompleteInteraction) {
        const player = useMainPlayer();
        const focusedValue = interaction.options.getFocused();

        //search platforms for the query
        let result_search;

        let choices = [];
        if (focusedValue) {
            choices.push({
                name: focusedValue.slice(0, 100),
                value: focusedValue.slice(0, 100),
            });
            if (isUrl(focusedValue)) {
                result_search = await player?.search(focusedValue, {
                    searchEngine: QueryType.AUTO,
                });
            } else {
                result_search = await player?.search(focusedValue, {
                    searchEngine: QueryType.YOUTUBE_SEARCH,
                });
            }
        }

        //set choices for autocomplete
        if (result_search?.playlist) {
            choices.push({
                name: result_search.playlist.title.slice(0, 100),
                value: result_search.playlist.url.slice(0, 100),
            });
        } else {
            result_search?.tracks?.forEach((track: any) =>
                choices.push({
                    name: track.title.slice(0, 100),
                    value: track.url.slice(0, 100),
                })
            );
        }

        return await interaction.respond(choices.slice(0, 5));
    }

    async run(
        interaction: ChatInputCommandInteraction | StringSelectMenuInteraction
    ): Promise<void> {
        const client = interaction.client as MyClient;
        //error checking
        if (!(interaction.member instanceof GuildMember)) {
            return;
        }

        if (!interaction.member?.voice?.channel) {
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(COLORS.failure)
                        .setDescription(`**You Must be in a VC!**`),
                ],
            });
            return;
        }

        if (!interaction.guild?.members.me) {
            return;
        }

        //verify permission to connect
        const voiceChannelPermissions =
            interaction.member.voice.channel.permissionsFor(
                interaction.guild.members.me
            );

        if (
            !voiceChannelPermissions.has(PermissionsBitField.Flags.Connect) ||
            !voiceChannelPermissions.has(PermissionsBitField.Flags.Speak)
        ) {
            console.log("no connect/speak permission");
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            "**I don't have permission to connect and speak in that voice channel**"
                        )
                        .setColor(0xff0000),
                ],
            });
            return;
        }

        const player = useMainPlayer();

        if (!player) {
            return;
        }

        if (!interaction.guild) {
            return;
        }

        const queue = player.nodes.create(interaction.guild, {
            metadata: {
                interaction: interaction,
                channel: interaction.channel,
                client: interaction.guild.members.me,
                requestedBy: interaction.user,
            },
            selfDeaf: true,
            volume: 80,
            leaveOnEmpty: true,
            leaveOnEnd: true,
        }) as GuildQueue;

        let embed = new EmbedBuilder(); //need to change this to embed builder for v14 (done)

        //grabs query string differently depending on which interaction type it is
        let query;
        if (interaction.isChatInputCommand()) {
            query = interaction.options.getString("query");
        } else if (interaction.isStringSelectMenu()) {
            const stringSelectMenuInteraction =
                interaction as StringSelectMenuInteraction; //switch to stringselect menu interaction to get value
            query = stringSelectMenuInteraction.values[0];
        }

        //error check query
        if (!query) {
            return;
        }

        let result_search;

        let tracks: Track[];
        if (isUrl(query)) {
            //auto searches the url
            console.log(`searching url: ${query}`);

            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(COLORS.search)
                        .setTitle("Searching...")
                        .setDescription("searching URL "),
                ],
            });

            result_search = await player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO,
            });

            tracks = result_search.tracks; //add multiple tracks if playlist/album
        } else {
            //searches youtube if its not a url
            console.log(`searching prompt: ${query}`);

            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(COLORS.search)
                        .setTitle("Searching...")
                        .setDescription(`searching youtube for ${query}`),
                ],
            });

            result_search = await player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_SEARCH,
            });

            tracks = [result_search.tracks[0]]; //adds 1 track from search
        }

        if (tracks.length === 0) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**No Results!**`),
                ],
            });
            return;
        }

        try {
            queue.addTrack(tracks);
        } catch (error) {
            console.error(error);
        }

        try {
            //verify vc connection
            if (!queue.connection) {
                await queue.connect(interaction.member?.voice.channel);
            }
        } catch (error) {
            queue.delete();
            console.log(error);
            await interaction.editReply({
                content: "could not join voice channel",
            });
            return;
        }

        if (!queue.node.isPlaying()) {
            await queue.node.play(); //play if not already playing
        }

        //build embed based on info
        if (tracks.length > 1) {
            embed
                .setColor(0xa020f0) //purple
                .setTitle(
                    `Queued ${tracks.length} Tracks From \`${result_search.playlist?.title}\``
                )
                .setDescription(
                    `**Starting With**\n**[${tracks[0].title}](${tracks[0].url})**\nBy ${tracks[0].author}`
                )
                .setThumbnail(tracks[0].thumbnail)
                .setFooter({
                    text: `${interaction.user.username}`,
                    iconURL: interaction.user.avatarURL() || undefined,
                })
                .setTimestamp();
        } else {
            if (queue.tracks.size == 0) {
                //added 1 track and no tracks in queue
                embed
                    .setColor(0xa020f0) //purple
                    .setTitle(`**Playing**`)
                    .setDescription(
                        `**[${tracks[0].title}](${tracks[0].url})**\n*By ${tracks[0].author}* | ${tracks[0].duration}`
                    )
                    .setThumbnail(tracks[0].thumbnail)
                    .setFooter({
                        text: `${interaction.user.username}`,
                        iconURL: interaction.user.avatarURL() || undefined,
                    })
                    .setTimestamp();
            } else {
                //added 1 track and other tracks in queue
                embed
                    .setColor(0xa020f0) //purple
                    .setTitle(`**Queued in Position ${queue.tracks.size}**`)
                    .setDescription(
                        `**[${tracks[0].title}](${tracks[0].url})**\n*By ${tracks[0].author}* | ${tracks[0].duration}`
                    )
                    .setThumbnail(tracks[0].thumbnail)
                    .setFooter({
                        text: `${interaction.user.username}`,
                        iconURL: interaction.user.avatarURL() || undefined,
                    })
                    .setTimestamp();
            }
        }

        //console.log(queue.tracks.length)

        const reply = await interaction.editReply({
            embeds: [embed],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("pauseButton")
                            //.setLabel("Pause")
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji({
                                name: "Pause",
                                id: "1150516067983171755",
                            }) // Set emoji here using setEmoji
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`skipButton`)
                            //.setLabel(`Skip`)
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji({
                                name: "Next",
                                id: "1150516100824571965",
                            })
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("shuffleButton")
                            //.setLabel(`Shuffle`)
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji({
                                name: "Shuffle",
                                id: "1150515970432053249",
                            })
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`queueButton`)
                            .setLabel(`Queue`)
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji({
                                name: "Queue",
                                id: "1150521944828039269",
                            })
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`like`)
                            .setLabel("Like")
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji({
                                name: "Heart",
                                id: "1150523515250942025",
                            })
                    ),
            ],
        });

        //want to pass json version of track to button to decrease size
        const trackJson = tracks[0].toJSON(true);

        //console.log(trackJson);

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 3_600_000, //1 hour
            dispose: true,
        });

        collector.on(`collect`, async (interaction) => {
            //only use collector for like
            if (interaction.customId != `like`) {
                return;
            }

            let likeCommand = client.commands.get(`like`) as Like;
            await likeCommand.likeButton(interaction, trackJson);
        });

        collector.on(`end`, (interaction) => {
            //delete self here
        });
    }
}
