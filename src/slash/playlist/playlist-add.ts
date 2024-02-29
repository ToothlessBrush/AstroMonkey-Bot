import {
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    CommandInteraction,
    ComponentType,
    Message,
    EmbedBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";

import { QueryType, Track, useMainPlayer } from "discord-player";

import { IServer, Server } from "./../../model/Server.js";
import { IUser, User } from "./../../model/User.js";
import { IPlaylist } from "../../model/Playlist.js";

import isUrl from "./../../utils/isUrl";
import MyClient from "../../utils/MyClient.js";
import Like from "./like.js";
import BaseCommand from "../../utils/BaseCommand.js";

export default class PlaylistAdd extends BaseCommand {
    // private track: Track | undefined;
    // private userDoc: IUser | null;
    // private serverDoc: IServer | null;

    constructor() {
        super();
    }

    data = new SlashCommandBuilder()
        .setName("playlist-add")
        .setDescription("add tracks to a playlist")
        .addStringOption((option) =>
            option
                .setName("playlist")
                .setDescription("name of the playlist you want to add to")
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription(
                    "song you want to search for and add to playlist"
                )
                .setRequired(true)
        );

    async autocomplete(interaction: AutocompleteInteraction) {
        const focusedValue = interaction.options.getFocused();
        let choices = ["Likes"];
        await Server.findOne({ "server.ID": interaction.guild?.id }).then(
            (server) => {
                if (!server) {
                    return;
                }
                if (server.playlists) {
                    server.playlists
                        .map((playlist) => playlist.name)
                        .forEach((name) => {
                            choices.push(name);
                        });
                }
            }
        );
        await User.findOne({ ID: interaction.user.id }).then((user) => {
            if (!user) {
                return;
            }
            if (user.playlists) {
                user.playlists
                    .map((playlist) => playlist.name)
                    .forEach((name) => {
                        choices.push(name);
                    });
            }
        });

        choices = removeDuplicates(choices);
        function removeDuplicates<T>(arr: T[]): T[] {
            return arr.filter((item, index) => arr.indexOf(item) === index);
        }

        const filtered = choices.filter((choice) =>
            choice.startsWith(focusedValue)
        );

        filtered.slice(0, 25);

        await interaction.respond(
            filtered.map((choice) => ({ name: choice, value: choice }))
        );
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const client = interaction.client as MyClient;
        const playlistName = interaction.options.get("playlist")
            ?.value as string;
        const query = interaction.options.get("query")?.value as string;
        const serverID = interaction.guild?.id;
        const userID = interaction.user.id;

        if (playlistName == "Likes") {
            const likeCommand = client.commands.get("like") as Like;
            likeCommand.run(interaction);
            return;
        }

        //search for playlist in db for server
        const serverDoc = await Server.findOne({ "server.ID": serverID });

        let serverPL: IPlaylist | undefined;
        if (serverDoc) {
            serverPL = serverDoc.playlists.find(
                (playlist) => playlist.name == playlistName
            );
        }

        //search for playlist in db for user
        const userDoc = await User.findOne({ ID: userID });

        let userPL: IPlaylist | undefined;
        if (userDoc) {
            userPL = userDoc.playlists.find(
                (playlist) => playlist.name == playlistName
            );
        }

        //if playlist not found
        if (!userPL && !serverPL) {
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(
                            `Could Not Find Playlist With Name: \`${playlistName}\``
                        )
                        .setDescription(
                            `Create a playlist with </create-playlist:1138955261441224825>`
                        ),
                ],
            });
            return;
        }

        const track = await this.searchQuery(query, interaction); //searches for track

        if (!track) {
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle("No Results!"),
                ],
            });
            return;
        }

        if (serverPL && userPL) {
            const reply = await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00cbb7)
                        .setTitle("Found 2 Playlists!")
                        .setDescription(
                            `There are 2 playlists named \`${serverPL.name}\`!\n\nWould you like to add the track to the server playlist or your personal playlist?`
                        ),
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`addServerPL`)
                            .setLabel(`Server`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`addUserPL`)
                            .setLabel(`Personal`)
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
            });

            // const filter = (i: ButtonInteraction) => {
            //     i.user.id == interaction.user.id
            // }

            //I dont like how many parameters this function has but oh well
            this.createDuplicateButtonsCollector(
                reply,
                serverPL,
                userPL,
                track,
                serverDoc,
                userDoc
            );

            return;
        }

        //save to db
        if (userPL && userDoc) {
            userPL.tracks.push(track.toJSON(true));
            userDoc.save();
        }

        if (serverPL && serverDoc) {
            serverPL.tracks.push(track.toJSON(true));
            serverDoc.save();
        }

        interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0)
                    .setTitle(
                        `Added to \`${userPL ? userPL.name : serverPL?.name}\``
                    )
                    .setDescription(
                        `**[${track.title}](${track.url})** \n*By ${track.author}* | ${track.duration}`
                    )
                    .setThumbnail(track.thumbnail)
                    .setFooter({
                        text: `${interaction.user.username}`,
                        iconURL: interaction.user.avatarURL() || undefined,
                    })
                    .setTimestamp(),
            ],
        });
        return;
    }

    async duplicateButton(
        interaction: ButtonInteraction,
        schema: IUser | IServer | null,
        playlist: IPlaylist | undefined,
        track: Track | undefined
    ) {
        //await interaction.deferReply()

        if (!track) {
            return;
        }

        if (!schema) {
            return interaction.reply({
                content: "Playlist Data Not Found!",
                embeds: [],
                components: [],
            });
        }
        //find playlist based on doc id
        // let playlist = schema.playlists.find(
        //     (playlist) => playlist._id?.toString() == playlistID
        // )

        if (!playlist) {
            return interaction.reply({
                content: "Playlist Data Not Found!",
                embeds: [],
                components: [],
            });
        }

        playlist.tracks.push(track?.toJSON(true));

        if (`save` in schema) {
            try {
                await schema.save();
            } catch (error) {
                console.error(error);
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle(`Somthing went wrong!`),
                    ],
                });
            }
        }

        //this.track = track;

        return this.trackAddedReply(interaction, playlist.name, track);
    }

    private async createDuplicateButtonsCollector(
        reply: Message,
        serverPL: IPlaylist,
        userPL: IPlaylist,
        track: Track,
        serverDoc: IServer | null,
        userDoc: IUser | null
    ) {
        //set it to local variables to avoid getting overwritten during the time it takes the user to press the button //this is stupid because we are dealing with async functions so class variables are not good
        // const ServerDoc = this.serverDoc;
        // const UserDoc = this.userDoc;
        // const track = this.track;

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
        });

        collector.on(`collect`, (interaction) => {
            const isAddServerPL = interaction.customId == `addServerPL`;
            this.duplicateButton(
                interaction,
                isAddServerPL ? serverDoc : userDoc,
                isAddServerPL ? serverPL : userPL,
                track
            );
            collector.stop();
        });
    }

    private async trackAddedReply(
        interaction: ChatInputCommandInteraction | ButtonInteraction,
        playlistName: string,
        track: Track | undefined
    ) {
        //const track = this.track;

        const embed = new EmbedBuilder()
            .setColor(0xa020f0)
            .setTitle(`Added to \`${playlistName}\``)
            .setDescription(
                `**[${track?.title}](${track?.url})** \n*By ${track?.author}* | ${track?.duration}`
            )
            .setThumbnail(track?.thumbnail || null)
            .setFooter({
                text: `${interaction.user.username}`,
                iconURL: interaction.user.avatarURL() || undefined,
            })
            .setTimestamp();

        if (interaction.isChatInputCommand()) {
            return await interaction.editReply({
                embeds: [embed],
                components: [],
            });
        } else if (interaction.isButton()) {
            return await interaction.update({
                embeds: [embed],
                components: [],
            });
        }
    }

    /** search youtube, spotify, or soundcloud for a track and returns it as an object
     *
     * Note: updates button interaction
     *
     * @param {String} query query to search for
     * @param {object} interaction discord interaction object
     * @returns {object} Track object to add to db
     */
    private async searchQuery(
        query: string,
        interaction: CommandInteraction | ButtonInteraction
    ): Promise<Track | undefined> {
        const buttonInteraction = interaction.isButton();

        const player = useMainPlayer();
        if (!player) {
            return;
        }
        let result_search;
        if (isUrl(query)) {
            console.log(`searching url: ${query}`);

            const URLembed = new EmbedBuilder()
                .setColor(0x00cbb7)
                .setTitle("Searching...")
                .setDescription("searching URL ");

            if (buttonInteraction) {
                await interaction.update({
                    embeds: [URLembed],
                });
            } else {
                await interaction.editReply({
                    embeds: [URLembed],
                });
            }

            result_search = await player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO,
            });
        } else {
            //searches youtube if its not a url
            console.log(`searching prompt: ${query}`);

            const YTembed = new EmbedBuilder()
                .setColor(0x00cbb7)
                .setTitle("Searching...")
                .setDescription(`searching youtube for ${query}`);

            if (buttonInteraction) {
                await interaction.update({
                    embeds: [YTembed],
                });
            } else {
                await interaction.editReply({
                    embeds: [YTembed],
                });
            }

            result_search = await player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_SEARCH,
            });
        }

        if (!result_search) {
            return;
        }

        //this.track = result_search.tracks[0];
        return result_search.tracks[0];
    }
}
