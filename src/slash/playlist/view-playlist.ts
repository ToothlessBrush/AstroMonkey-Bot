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
        .setName("view-playlist")
        .setDescription("view the contents of a playlist")
        .addStringOption((option) =>
            option
                .setName("playlist")
                .setDescription("name of the playlists you would like to view")
                .setAutocomplete(true)
                .setRequired(true)
        ),

    autocomplete: async ({ interaction }) => {
        const focusedValue = interaction.options.getFocused()

        let choices = ["Likes"]
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

    run: async ({ interaction }) => {
        const serverID = interaction.guild.id
        const userID = interaction.user.id
        const playlistName = interaction.options.getString("playlist")

        if (playlistName == "Likes") {
            likedTracks = await User.findOne({ ID: userID }).then((user) => {
                if (!user) {
                    return
                }

                return user.likes
            })

            const playlist = {
                name: "Likes",
                creater: {
                    name: interaction.user.username,
                    ID: interaction.user.id,
                },
                tracks: likedTracks,
            }

            showTracks(interaction, playlist)
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
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00cbb7)
                        .setTitle("Found 2 Playlists!")
                        .setDescription(
                            `There are 2 playlists named \`${serverPL.name}\`!\n\nWould you like to add the track to the server playlist or your personal playlist?`
                        ),
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `showServerPL~${serverPL._id.toString()}`
                            )
                            .setLabel(`Server`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`showUserPL~${userPL._id.toString()}`)
                            .setLabel(`Personal`)
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
            })
        }

        const playlist = serverPL || userPL

        await showTracks(interaction, playlist)
    },

    //need to switch to collector
    buttons: async (interaction, docType, playlistId) => {
        let playlist

        if (docType == "server") {
            playlist = await Server.findOne({
                "server.ID": interaction.guild.id,
            }).then((server) => {
                return server.playlists.find(
                    (playlist) => playlist._id.toString() == playlistId
                )
            })
        } else if (docType == "user") {
            playlist = await User.findOne({ ID: interaction.user.id }).then(
                (user) => {
                    return user.playlists.find(
                        (playlist) => playlist._id.toString() == playlistId
                    )
                }
            )
        }

        return await showTracks(interaction, playlist)
    },
}

/** respond to interaction with list of tracks in playlist
 *
 * @param {object} interaction discord interaction object
 * @param {object} playlist playlist object which contains tracks and playlist info
 * @returns nothing
 */

async function showTracks(interaction, playlist) {
    const buttonInteraction = interaction.isButton()

    if (!playlist) {
        const noPlaylistEmbed = {
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle(`${playlist.name} was not found!`),
            ],
            components: [],
        }

        if (buttonInteraction) {
            return await interaction.update(noPlaylistEmbed)
        } else {
            return await interaction.editReply(noPlaylistEmbed)
        }
    }

    if (playlist.tracks.length == 0) {
        const noTracksEmbed = {
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle(`**Playlist is Empty!**`)
                    .setDescription(
                        `add tracks with </playlist-add:1127691531348873226>`
                    ),
            ],
            components: [],
        }
        if (buttonInteraction) {
            return await interaction.update(noTracksEmbed)
        } else {
            return await interaction.editReply(noTracksEmbed)
        }
    }

    const tracksString = playlist.tracks
        .map((track, i) => {
            return `**${i + 1}.** \`[${track.duration}]\` [${track.title}](${
                track.url
            })\n**Added By: <@${track.requestedBy}>**`
        })
        .join("\n")

    const viewPlaylistEmbed = {
        embeds: [
            new EmbedBuilder()
                .setColor(0xa020f0)
                .setTitle(`**${playlist.name}**`)
                .setDescription(tracksString),
        ],
        components: [],
    }

    if (buttonInteraction) {
        return await interaction.update(viewPlaylistEmbed)
    } else {
        return await interaction.editReply(viewPlaylistEmbed)
    }
}