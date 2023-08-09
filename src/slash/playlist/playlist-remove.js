const {
    EmbedBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Embed,
    ButtonInteraction,
} = require("discord.js")

const path = require("path")
const Server = require(path.join(__dirname, "./../../model/Server.js"))
const User = require(path.join(__dirname, "./../../model/User.js"))
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
            choices.push("Likes")
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

            if (playlistName == "Likes") {
                User.findOne({ ID: interaction.user.id }).then((user) => {
                    if (!user) {
                        return
                    }
                    user.likes
                        .map((track) => track.title)
                        .forEach((trackName) => choices.push(trackName))
                })
            }

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

        if (playlistName == "Likes") {
            User.findOne({ ID: userID }).then((user) => {
                if (!user) {
                    return interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xff0000)
                                .setTitle("Your Likes Playlist Is Empty!"),
                        ],
                    })
                }
                const trackIndex = user.likes.findIndex(
                    (track) => track.title == query
                )

                if (trackIndex == -1) {
                    console.log("here")
                    return interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xff0000)
                                .setTitle(`\`${query}\` was not found!`),
                        ],
                    })
                }

                user.likes.splice(trackIndex, 1)

                user.save()

                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xa020f0)
                            .setTitle(`Removed: \`${query}\` From Your Likes`),
                    ],
                })
            })
            return
        }

        const server = await Server.findOne({ "server.ID": serverID })
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
            const trackId =
                serverPL?.tracks.find((track) => track.title == query)?.id ||
                userPL?.tracks.find((track) => track.title == query)?.id

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
                                `removeServerPL~${serverPL._id.toString()}~${trackId}`
                            )
                            .setLabel(`Server`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(
                                `removeUserPL~${userPL._id.toString()}~${tracmId}`
                            )
                            .setLabel(`Personal`)
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
            })
        }

        if (!serverPL && !userPL) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(`Playlist: ${playlistName} Not Found!`),
                ],
            })
        }

        if (serverPL) {
            removeTrack(interaction, serverPL, query)
            server.save()
        }

        if (userPL) {
            removeTrack(interaction, userPL, query)
            user.save()
        }
    },

    buttons: async (interaction, docType, playlistId, query) => {
        if (docType == "server") {
            await Server.findOne({ "server.ID": interaction.guild.id }).then(
                async (server) => {
                    if (!server) {
                        return await interaction.update({
                            content: "Server Data not found!",
                            embeds: [],
                            components: [],
                        })
                    }

                    let playlist = server.playlists.find(
                        (playlist) => playlist._id.toString() == playlistId
                    )

                    if (!playlist) {
                        return await interaction.update({
                            content: "Playlist Data Not Found!",
                            embeds: [],
                            components: [],
                        })
                    }

                    removeTrack(interaction, playlist, query)

                    server.save()
                }
            )
        } else if (docType == "user") {
            await User.findOne({ ID: interaction.user.id }).then(
                async (user) => {
                    if (!user) {
                        return await interaction.update({
                            content: "User Data not found!",
                            embeds: [],
                            components: [],
                        })
                    }

                    let playlist = user.playlists.find(
                        (playlist) => playlist._id.toString() == playlistId
                    )

                    if (!playlist) {
                        return await interaction.update({
                            content: "Playlist Data Not Found!",
                            embeds: [],
                            components: [],
                        })
                    }

                    removeTrack(interaction, playlist, query)

                    user.save()
                }
            )
        }
    },
}

/** searches and removes track from a playlist (doesnt save db)
 *
 * @param {object} interaction discordjs interaction
 * @param {object} playlist the playlist object to remove track from
 * @param {String} query the name of track to remove
 * @returns {void} points to playlist array
 */
async function removeTrack(interaction, playlist, query) {
    const buttonInteraction = interaction.isButton()

    const trackIndex = playlist.tracks.findIndex(
        (track) => track.title == query
    )

    if (trackIndex == -1) {
        const noTrackFoundEmbed = {
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle(`\`${query}\` was not found!`),
            ],
            components: [],
        }
        if (buttonInteraction) {
            return await interaction.update(noTrackFoundEmbed)
        } else {
            return await interaction.editReply(noTrackFoundEmbed)
        }
    }

    playlist.tracks.splice(trackIndex, 1)

    const removedTrackEmbed = {
        embeds: [
            new EmbedBuilder()
                .setColor(0xa020f0)
                .setTitle(`Removed: \`${query}\` From \`${playlist.name}\``),
        ],
        components: [],
    }
    if (buttonInteraction) {
        return await interaction.update(removedTrackEmbed)
    } else {
        return await interaction.editReply(removedTrackEmbed)
    }
}
