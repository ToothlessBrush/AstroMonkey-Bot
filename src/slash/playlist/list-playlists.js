const {
    EmbedBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js")
const { QueryType } = require("discord-player")

const path = require("path")
const Server = require(path.join(__dirname, "./../../model/Server.js"))
const User = require(path.join(__dirname, "./../../model/User.js"))

module.exports = {
    data: new SlashCommandBuilder()
        .setName("list-playlists")
        .setDescription("lists your playlists and server playlists"),

    run: async ({ interaction }) => {
        const serverID = interaction.guild.id
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
            interaction.guild.name
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

        function mapPlaylists(playlists) {
            if (!playlists) {
                return `No Playlists`
            }

            return playlists
                .map((playlists) => {
                    return `**-** **${playlists.name}** Tracks: \`${playlists.tracks.length}\` Created by: <@${playlists.creater.ID}>`
                })
                .join("\n")
        }
    },
}
