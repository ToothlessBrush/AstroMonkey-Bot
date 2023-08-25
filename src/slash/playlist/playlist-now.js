const { SlashCommandBuilder, ButtonBuilder } = require("@discordjs/builders")
const { EmbedBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js")
const path = require("path")
const Server = require(path.join(__dirname, "./../../model/Server.js"))
const User = require(path.join(__dirname, "./../../model/User.js"))

module.exports = {
    data: new SlashCommandBuilder()
        .setName("playlist-now")
        .setDescription(
            "play tracks from a playlist while skipping current queue"
        )
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

        const playlistName = interaction.options.getString("playlist")
        const shuffle = interaction.options.getBoolean("shuffle") || false

        const serverID = interaction.guild.id
        const userID = interaction.user.id

        if (playlistName == "Likes") {
            const likedTracks = await User.findOne({
                ID: interaction.user.id,
            }).then((user) => {
                if (!user) {
                    return
                }
                return user.likes
            })

            //build fake playlist object for function
            const playlist = {
                name: "Likes",
                creater: {
                    name: interaction.user.username,
                    ID: interaction.user.id,
                },
                tracks: likedTracks,
            }

            return playTracks(interaction, playlist, shuffle)
        }

        //find playlist
        const serverPlaylist = await Server.findOne({
            "server.ID": serverID,
        }).then(async (server) => {
            if (!server) {
                return
            }
            return server.playlists.find(
                (playlist) => playlist.name == playlistName
            )
        })

        const userPlaylist = await User.findOne({
            ID: userID,
        }).then(async (user) => {
            if (!user) {
                return
            }
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
                                `serverPlaylistButton_${serverPlaylist._id.toString()}_${shuffle}`
                            )
                            .setLabel(`Server`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(
                                `userPlaylistButton_${userPlaylist._id.toString()}_${shuffle}`
                            )
                            .setLabel(`Personal`)
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
            })
        }

        const playlist = serverPlaylist || userPlaylist

        return await playTracks(interaction, playlist, shuffle)
    },

    //handle buttons on interaction
    //buttons for case when 2 playlists found
    buttons: async (interaction, docType, playlistId, shuffle) => {
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

        return await playTracks(interaction, playlist, shuffle)
    },
}

/** queues tracks from playlist
 *
 * @param {object} interaction discord interaction object
 * @param {object} playlist playlist object which contains tracks
 * @param {boolean} shuffle whether to shuffle queue or not before adding
 * @returns nothing
 */
async function playTracks(interaction, playlist, shuffle) {
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
            skipOnNoStream: true,
        }
    )

    const buttonInteraction = interaction.isButton() //if we update or reply

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

    if (playlist.tracks.length === 0) {
        const emptyPlaylistEmbed = {
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setDescription(
                        `**There are 0 tracks in \`${playlist.name}\`**`
                    ),
            ],
            components: [],
        }

        if (buttonInteraction) {
            return await interaction.update(emptyPlaylistEmbed)
        } else {
            return await interaction.editReply(emptyPlaylistEmbed)
        }
    }

    let tracks = playlist.tracks

    if (shuffle == true) {
        shuffleArray(tracks)
    }

    //get the position of the playlist to skip to
    const QUEUE_SIZE = queue.tracks.size

    await queue.addTrack(tracks)

    queue.node.skipTo(QUEUE_SIZE)

    queue.interaction = interaction

    try {
        //verify vc connection
        if (!queue.connection) {
            await queue.connect(interaction.member.voice.channel)
        }
    } catch (error) {
        queue.delete()
        console.log(error)
        if (buttonInteraction) {
            return await interaction.update({
                content: "could not join voice channel",
            })
        } else {
            return await interaction.editReply({
                content: "could not join voice channel",
            })
        }
    }

    if (!queue.node.isPlaying()) await queue.node.play()

    //reply with playlist info
    const queuedPlaylistEmbed = {
        embeds: [
            new EmbedBuilder()
                .setColor(0xa020f0)
                .setTitle(`Playing: \`${playlist.name}\` Now!`)
                .setDescription(
                    `**Starting With**\n**[${tracks[0].title}](${tracks[0].url})**\nBy ${tracks[0].author}`
                )
                .setThumbnail(tracks[0].thumbnail),
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`pauseButton`)
                        .setLabel(`Pause`)
                        .setStyle(ButtonStyle.Secondary)
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`skipButton`)
                        .setLabel(`Skip`)
                        .setStyle(ButtonStyle.Secondary)
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`queueButton`)
                        .setLabel(`Queue`)
                        .setStyle(ButtonStyle.Secondary)
                ),
        ],
    }

    if (buttonInteraction) {
        return await interaction.update(queuedPlaylistEmbed)
    } else {
        return await interaction.editReply(queuedPlaylistEmbed)
    }
}

//durstenfeld shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[array[i], array[j]] = [array[j], array[i]]
    }
}
