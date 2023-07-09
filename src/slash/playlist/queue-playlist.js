const { SlashCommandBuilder, ButtonBuilder } = require("@discordjs/builders")
const { EmbedBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js")
const Server = require("./../../model/server")
const User = require("./../../model/User")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue-playlist")
        .setDescription("add the tracks from a playlist to queue")
        .addStringOption((option) =>
            option
                .setName("playlist")
                .setDescription("the name of the playlist to add to queue")
                .setRequired(true)
        )
        .addBooleanOption((option) =>
            option
                .setName("shuffle")
                .setDescription("add the music to the playlist shuffled or not")
                .setRequired(false)
        ),

    run: async ({ client, interaction }) => {
        if (!interaction.member.voice.channel) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**You Must be in a VC!**`),
                ],
            })
        }

        const queue = await client.player.nodes.create(interaction.guild, {
            metadata: {
                channel: interaction.channel,
                client: interaction.guild.members.me,
                requestedBy: interaction.user,
            },
            selfDeaf: true,
            volume: 80,
            leaveOnEmpty: true,
            leaveOnEnd: true,
        })

        if (!queue.connection) {
            await queue.connect(interaction.member.voice.channel)
        }

        let playlistName = interaction.options.getString("playlist")

        const serverID = interaction.guild.id
        const userID = interaction.user.id

        //find playlist
        Server.findOne({ "server.ID": serverID }).then(async (server) => {
            const playlist = server.playlists.find(
                (playlist) => playlist.name == playlistName
            )

            if (!playlist) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle("Playlist Not Found!"),
                    ],
                })
            }

            if (playlist.tracks.length == 0) {
                console.log(
                    `cannot start playing as all songs are removed or dont exist`
                )
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle(
                                `Could not start playing as all tracks were removed or don't exist`
                            ),
                    ],
                })
            }

            console.log(playlist.tracks)
            queue.addTrack(playlist.tracks)

            if (!queue.node.isPlaying()) await queue.node.play()
        })
    },
}
