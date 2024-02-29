import {
    ChatInputCommandInteraction,
    CommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js";
import mongoose from "mongoose";

import { Server } from "./../../model/Server.js";
import { User } from "./../../model/User.js";
import { IPlaylist } from "../../model/Playlist.js";
import BaseCommand from "../../utils/BaseCommand.js";

export default class CreatePlaylist extends BaseCommand {
    constructor() {
        super();
    }

    data = new SlashCommandBuilder()
        .setName("create-playlist")
        .setDescription(
            "create a playlist which you can add songs to and play in queue"
        )
        .addStringOption((option) =>
            option
                .setName("type")
                .setDescription(
                    "create a private personal playlist or shared server playlist"
                )
                .setRequired(true)
                .addChoices(
                    { name: "Personal", value: "PERSONAL" },
                    { name: "Server", value: "SERVER" }
                )
        )
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("name of the playlist you want to create")
                .setRequired(true)
                .setMaxLength(100)
        );

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const serverType =
            (interaction.options.get("type")?.value as string) == "SERVER";

        if ((interaction.options.get("name")?.value as string) == "Likes") {
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle("Cannot Create Playlist Called Likes"),
                ],
            });
            return;
        }

        const playlistData: IPlaylist = {
            name: interaction.options.get("name")?.value as string,
            creater: {
                name: interaction.user.username,
                ID: interaction.user.id,
            },
            length: 0,
            tracks: [],
            _id: new mongoose.Types.ObjectId(),
        };

        if (serverType) {
            const serverID = interaction.guild?.id;

            const server = await Server.findOne({ "server.ID": serverID });

            if (server) {
                console.log("found server");

                //checks for duplicate playlists
                const playlistExists = server.playlists.find(
                    (playlist) => playlist.name == playlistData.name
                );

                if (playlistExists) {
                    console.log("playlist already exists");
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xff0000)
                                .setTitle("Playlist Already Exists!"),
                        ],
                    });
                    return;
                }

                server.playlists.push(playlistData);

                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xa020f0)
                            .setTitle("Created Playlist!")
                            .setDescription(
                                `Created the \`${playlistData.name}\` playlist for this server! \n\nAdd Tracks with </playlist-add:1138955261441224829>`
                            ),
                    ],
                });
                server.save();
                return;
            } else {
                console.log("Creating server doc");
                const newServer = new Server({
                    server: {
                        name: interaction.guild?.name,
                        ID: interaction.guild?.id,
                    },
                    playlists: [playlistData],
                });

                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xa020f0)
                            .setTitle("Created Playlist!")
                            .setDescription(
                                `Created the \`${playlistData.name}\` playlist for this server! \n\nAdd Tracks with </playlist-add:1138955261441224829>`
                            ),
                    ],
                });
                newServer.save();
                return;
            }
        } else {
            const userID = interaction.user.id;

            const user = await User.findOne({ ID: userID });
            if (user) {
                const playlistExists = user.playlists.find(
                    (playlist) => playlist.name == playlistData.name
                );

                if (playlistExists) {
                    console.log("playlist already exists");
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xff0000)
                                .setTitle("Playlist Already Exists!"),
                        ],
                    });
                    return;
                } else {
                    user.playlists.push(playlistData);
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xa020f0)
                                .setTitle("Created Playlist!")
                                .setDescription(
                                    `Created the \`${playlistData.name}\` playlist for <@${interaction.user.id}>! \n\nAdd Tracks with </playlist-add:1138955261441224829>`
                                ),
                        ],
                    });
                    user.save();
                    return;
                }
            } else {
                console.log("Creating user doc");
                const newUser = new User({
                    name: interaction.user.username,
                    ID: interaction.user.id,
                    likes: [],
                    playlists: [playlistData],
                });
                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xa020f0)
                            .setTitle("Created Playlist!")
                            .setDescription(
                                `Created the \`${playlistData.name}\` playlist for <@${interaction.user.id}>! \n\nAdd Tracks with </playlist-add:1138955261441224829>`
                            ),
                    ],
                });
                newUser.save();
                return;
            }
        }
    }
}
