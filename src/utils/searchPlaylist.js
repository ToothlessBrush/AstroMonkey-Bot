const { EmbedBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js")

const Server = require("./../model/server")
const User = require("../model/User")

async function searchPlaylist(interaction, docType, playlistName) {
    const queue = await interaction.client.player.nodes.create(
        interaction.guild,
        {
            metadata: {
                channel: interaction.channel,
                client: interaction.guild.members.me,
                requestedBy: interaction.user,
            },
            selfDeaf: true,
            volume: 80,
            leaveOnEmpty: true,
            leaveOnEnd: true,
        }
    )

    let playlist

    if (docType == "server") {
        playlist = await Server.findOne({
            "server.ID": interaction.guild.id,
        }).then((server) => {
            return server.playlists.find(
                (playlist) => playlist.name == playlistName
            )
        })
    } else if (docType == "user") {
        playlist = await User.findOne({ ID: interaction.user.id }).then(
            (user) => {
                return user.playlists.find(
                    (playlist) => playlist.name == playlistName
                )
            }
        )
    }

    if (playlist.tracks.length === 0) {
        return interaction.update({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setDescription(
                        `**There are 0 tracks in \`${playlist.name}\`**`
                    ),
            ],
        })
    }

    if (!queue.connection) {
        await queue.connect(interaction.member.voice.channel)
    }
    
    queue.addTrack(playlist.tracks)

    if (!queue.node.isPlaying()) await queue.node.play()

    interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor(0xa020f0)
                .setTitle(`playing the ${playlist.name} playlist!`),
        ],
    })
}

module.exports = { searchPlaylist }
