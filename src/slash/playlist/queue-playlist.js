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
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addBooleanOption((option) =>
            option
                .setName("shuffle")
                .setDescription("add the music to the playlist shuffled or not")
                .setRequired(false)
        ),

    autocomplete: async ({ client, interaction }) => {
        const focusedValue = interaction.options.getFocused()
        let choices = []
        await Server.findOne({ "server.ID": interaction.guild.id }).then(
            (server) => {
                if (server.playlists) {
                    server.playlists
                        .map((playlist) => playlist.name)
                        .forEach((name) => {
                            choices.push(name)
                        })
                }
            }
        )
        await User.findOne({ ID: interaction.user.id }).then((user) => {
            if (user.playlists) {
                user.playlists
                    .map((playlist) => playlist.name)
                    .forEach((name) => {
                        choices.push(name)
                    })
            }
        })

        choices = removeDuplicates(choices)
        function removeDuplicates(arr) {
            return arr.filter((item, index) => arr.indexOf(item) === index)
        }

        const filtered = choices.filter((choice) =>
            choice.startsWith(focusedValue)
        )

        await interaction.respond(
            filtered.map((choice) => ({ name: choice, value: choice }))
        )
    },

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
        const serverPlaylist = await Server.findOne({
            "server.ID": serverID,
        }).then(async (server) => {
            return server.playlists.find(
                (playlist) => playlist.name == playlistName
            )
        })

        const userPlaylist = await User.findOne({
            ID: userID,
        }).then(async (user) => {
            return user.playlists.find(
                (playlist) => playlist.name == playlistName
            )
        })

        if (serverPlaylist && userPlaylist) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00cbb7)
                        .setTitle("Found 2 Playlists!")
                        .setDescription(
                            `There are 2 playlists named \`${serverPlaylist.name}\`!\n\nWould you like to play the server playlist or your personal playlist?`
                        ),
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `serverPlaylistButton_${serverPlaylist.name}`
                            )
                            .setLabel(`Server`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(
                                `userPlaylistButton_${userPlaylist.name}`
                            )
                            .setLabel(`Personal`)
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
            })
        }

        const playlist = serverPlaylist || userPlaylist

        if (!playlist)
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(`${playlist.name} was not found!`),
                ],
            })

        queue.addTrack(serverPlaylist.tracks)

        if (!queue.node.isPlaying()) await queue.node.play()

        interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0)
                    .setTitle(`playing the ${playlist.name} playlist!`),
            ],
        })
    },
}
