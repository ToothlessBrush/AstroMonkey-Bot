const { EmbedBuilder, SlashCommandBuilder } = require("discord.js")
const mongoose = require("mongoose")
const Server = require("./../../model/server")
const Playlist = require("./../../model/Playlist")
const User = require("./../../model/User")

module.exports = {
    data: new SlashCommandBuilder()
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
        ),

    run: async ({ client, interaction }) => {
        const playlistData = {
            name: interaction.options.getString("name"),
            creater: {
                name: interaction.user.username,
                ID: interaction.user.id,
            },
            length: 0,
            tracks: [],
        }

        const serverID = interaction.guild.id

        Server.findOne({ "server.ID": serverID }).then((server) => {
            if (server) {
                console.log("found server")
                server.playlists.push(playlistData)
                return server.save()
            } else {
                console.log("Server Not Found")
                const newServer = new Server({
                    server: {
                        name: interaction.guild.name,
                        ID: interaction.guild.id,
                    },
                    playlists: [playlistData],
                })
                return newServer.save()
            }
        })
    },
}
