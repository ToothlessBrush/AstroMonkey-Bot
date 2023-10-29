import { ChatInputCommandInteraction, CommandInteraction } from "discord.js"
import {
    EmbedBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js"
import { QueryType } from "discord-player"

import path from "path"
import { Server, IServer } from "./../../model/Server.js"
import { User, IUser } from "./../../model/User.js"
import { IPlaylist } from "../../model/Playlist"

export class ListPlaylists {
    data = new SlashCommandBuilder()
        .setName("list-playlists")
        .setDescription("lists your playlists and server playlists")

    async run(interaction: ChatInputCommandInteraction) {
        const serverID = interaction.guild?.id
        const userID = interaction.user.id

        let serverPlaylists

        await Server.findOne({ "server.ID": serverID }).then((server) => {
            if (server) {
                serverPlaylists = server.playlists
            }
        })

        let userPlaylists

        await User.findOne({ ID: userID }).then((user) => {
            if (user) {
                userPlaylists = user.playlists
            }
        })

        const playlistString = `**${
            interaction.guild?.name
        }'s Playlists**\n${mapPlaylists(serverPlaylists)}\n\n **${
            interaction.user.username
        }'s Playlists**\n${mapPlaylists(userPlaylists)} `

        interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0)
                    .setDescription(playlistString),
            ],
        })

        function mapPlaylists(playlists: IPlaylist[] | undefined) {
            if (!playlists) {
                return `No Playlists`
            }

            return playlists
                .map((playlists) => {
                    return `**-** **${playlists.name}** Tracks: \`${playlists.tracks.length}\` Created by: <@${playlists.creater.ID}>`
                })
                .join("\n")
        }
    }
}
