import {
    GuildMember,
    CommandInteraction,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    ComponentType,
} from "discord.js";

import { SlashCommandBuilder, ButtonBuilder } from "@discordjs/builders";
import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonStyle,
    PermissionsBitField,
} from "discord.js";
import { QueryType, Track, useMainPlayer } from "discord-player";

import isUrl from "./../../utils/isUrl";
import MyClient from "../../utils/MyClient";
import BaseCommand from "../../utils/BaseCommand";
import Like from "../playlist/like";

export default class SearchSpotify extends BaseCommand {
    constructor() {
        super();
    }

    data = new SlashCommandBuilder()
        .setName("spotifysearch")
        .setDescription(
            "searches spotify with a prompt and adds first result to queue"
        )
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription("search term for spotify (use /play for url)")
                .setRequired(true)
                .setAutocomplete(true)
        );

    async autocomplete(interaction: AutocompleteInteraction) {
        const player = useMainPlayer();

        if (!player) {
            return;
        }

        const focusedValue = interaction.options.getFocused();

        let result_search;

        let choices = [];

        if (focusedValue) {
            choices.push({ name: focusedValue, value: focusedValue });
            result_search = await player.search(focusedValue, {
                searchEngine: QueryType.SPOTIFY_SEARCH,
            });
        }

        if (result_search?.playlist) {
            choices.push({
                name: result_search.playlist.title,
                value: result_search.playlist.title,
            });
        } else {
            result_search?.tracks?.forEach((track: Track) => {
                choices.push({
                    name: track.title.slice(0, 100),
                    value: track.title.slice(0, 100),
                });
            });
        }

        return await interaction.respond(choices.slice(0, 6));
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const client = interaction.client as MyClient;

        if (!(interaction.member instanceof GuildMember)) {
            return;
        }

        if (!interaction.member?.voice?.channel) {
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**You Must be in a VC!**`),
                ],
            });
            return;
        }

        if (!interaction.guild) {
            return;
        }

        if (!interaction.guild.members.me) {
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
        });

        let embed = new EmbedBuilder(); //need to change this to embed builder for v14 (done)

        //plays a search term or url if not in playlist
        let query = interaction.options.get("query")?.value as string;

        if (isUrl(query)) {
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(
                            `**query cant be url! use /play to use url.**`
                        ),
                ],
            });
            return;
        }

        let tracks: Track[] = [];
        console.log(`searching spotify: ${query}`);

        interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x00cbb7)
                    .setTitle("Searching...")
                    .setDescription(`searching spotify for ${query}`),
            ],
        });

        const result_search = await player.search(query, {
            requestedBy: interaction.user,
            searchEngine: QueryType.SPOTIFY_SEARCH,
        });

        tracks.push(result_search.tracks[0]); //adds first result

        if (!tracks[0]) {
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**No Results!**`),
                ],
            });
            return;
        }

        //console.log(tracks)

        // if (tracks.length == 0) {
        //     console.log(
        //         `cannot start playing as all songs are removed or dont exist`
        //     )
        //     interaction.editReply({
        //         embeds: [
        //             new EmbedBuilder()
        //                 .setColor(0xff0000)
        //                 .setTitle(
        //                     `Could not start playing as all tracks were removed or don't exist`
        //                 ),
        //         ],
        //     })
        //     return
        // }

        queue.addTrack(tracks); //adds track(s) from the search result

        try {
            //verify vc connection
            if (!queue.connection) {
                await queue.connect(interaction.member.voice.channel);
            }
        } catch (error) {
            queue.delete();
            console.log(error);
            await interaction.editReply({
                content: "could not join voice channel",
            });
            return;
        }

        if (!queue.node.isPlaying()) await queue.node.play(); //play if not already playing

        //console.log(tracks)

        //build embed based on info
        if (tracks.length > 1) {
            //console.log(tracks)

            embed
                .setColor(0xa020f0) //purple
                .setTitle(`Queued ${tracks.length} Tracks`)
                //.setDescription(`**[${playlist.title}](${playlist.url})**`) //doesnt work for spotify
                .setThumbnail(tracks[0].thumbnail)
                .setFooter({ text: `source: ${tracks[0].source}` });
        } else {
            if (queue.tracks.size == 0) {
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

        const trackJson = tracks[0].toJSON(true);

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 3_600_000, //1 hour
            dispose: true,
        });

        collector.on(`collect`, (interaction) => {
            //only use collector for like
            if (interaction.customId != `like`) {
                return;
            }

            const likeCommand = client.commands.get(`like`) as Like;
            likeCommand.likeButton(interaction, trackJson);
        });
    }
}
