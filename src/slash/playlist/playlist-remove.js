const {
    EmbedBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js")

const Server = require("./../../model/server")
const User = require("./../../model/User")
const { trusted } = require("mongoose")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("playlist-remove")
        .setDescription("remove a track from a playlist")
        .addStringOption((option) =>
            option
                .setName("playlist")
                .setDescription("playlist to remove track from")
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("track")
                .setDescription("name of track to remove")
                .setAutocomplete(true)
                .setRequired(true)
        ),

    autocomplete: async ({ client, interaction }) => {
        const focusedOption = interaction.options.getFocused(true)

        let choices = []
        if (focusedOption.name == "playlist") {
            await Server.findOne({ "server.ID": interaction.guild.id }).then(
                (server) => {
                    if (!server) {
                        return
                    }
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
                if (!user) {
                    return
                }
                if (user.playlists) {
                    user.playlists
                        .map((playlist) => playlist.name)
                        .forEach((name) => {
                            choices.push(name)
                        })
                }
            })
        }

        if (focusedOption.name == "track") {
            const playlistName = interaction.options._hoistedOptions[0].value

            await Server.findOne({ "server.ID": interaction.guild.id }).then(
                (server) => {
                    if (!server) {
                        return
                    }
                    if (server.playlists) {
                        const playlist = server.playlists.find(
                            (playlist) => playlist.name == playlistName
                        )

                        if (!playlist) {
                            return
                        }

                        playlist.tracks
                            .map((track) => track.title)
                            .forEach((trackName) => {
                                choices.push(trackName)
                            })
                    }
                }
            )
            await User.findOne({ ID: interaction.user.id }).then((user) => {
                if (!user) {
                    return
                }
                if (user.playlists) {
                    const playlist = user.playlists.find(
                        (playlist) => playlist.name == playlistName
                    )

                    if (!playlist) {
                        return
                    }

                    playlist.tracks
                        .map((track) => track.title)
                        .forEach((trackName) => {
                            choices.push(trackName)
                        })
                }
            })
        }

        choices = removeDuplicates(choices)
        function removeDuplicates(arr) {
            return arr.filter((item, index) => arr.indexOf(item) === index)
        }

        const filtered = choices.filter((choice) =>
            choice.startsWith(focusedOption.value)
        )

        return await interaction.respond(
            filtered.map((choice) => ({ name: choice, value: choice }))
        )
    },

    run: async ({ client, interaction }) => {
        const playlistName = interaction.options.getString("playlist")
        const query = interaction.options.getString("track")
        const serverID = interaction.guild.id
        const userID = interaction.user.id

        let serverPL
        if (server) {
            serverPL = server.playlists.find(
                (playlist) => playlist.name == playlistName
            )
        }

        const user = await User.findOne({ ID: userID })

        let userPL
        if (user) {
            userPL = user.playlists.find(
                (playlist) => playlist.name == playlistName
            )
        }

        if (serverPL && userPL) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00cbb7)
                        .setTitle("Found 2 Playlists!")
                        .setDescription(
                            `There are 2 playlists named \`${serverPL.name}\`!\n\nWould you like to remove the track from the server playlist or your personal playlist?`
                        ),
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `removeServerPL_${playlistName}_${query}`
                            )
                            .setLabel(`Server`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(
                                `removeUserPL_${playlistName}_${query}`
                            )
                            .setLabel(`Personal`)
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
            })
        }
    },
}

async function removeTrack(interaction, query) {}
