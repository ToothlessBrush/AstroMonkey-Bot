const { SlashCommandBuilder, ButtonBuilder } = require("@discordjs/builders")
const { Track } = require("discord-player")
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonStyle,
    PermissionsBitField,
} = require("discord.js")
const path = require("path")
const Server = require(path.join(__dirname, "./../../model/Server.js"))
const User = require(path.join(__dirname, "./../../model/User.js"))

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
        if (!interaction.member.voice.channel) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**You Must be in a VC!**`),
                ],
            })
        }

        //verify permission to connect
        voiceChannelPermissions =
            interaction.member.voice.channel.permissionsFor(
                interaction.guild.members.me
            )

        if (
            !voiceChannelPermissions.has(PermissionsBitField.Flags.Connect) ||
            !voiceChannelPermissions.has(PermissionsBitField.Flags.Speak)
        ) {
            console.log("no connect/speak permission")
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            "**I don't have permission to connect and speak in that voice channel**"
                        )
                        .setColor(0xff0000),
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

            return queueTracks(interaction, playlist, shuffle)
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
                                `serverPlaylistButton~${serverPlaylist._id.toString()}~${shuffle}`
                            )
                            .setLabel(`Server`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(
                                `userPlaylistButton~${userPlaylist._id.toString()}~${shuffle}`
                            )
                            .setLabel(`Personal`)
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
            })
        }

        const playlist = serverPlaylist || userPlaylist

        return await queueTracks(interaction, playlist, shuffle)
    },

    //handle buttons on interaction
    //buttons for case when 2 playlists found

    //need to switch to collector
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

        return await queueTracks(interaction, playlist, shuffle)
    },
}

/** queues tracks from playlist
 *
 * @param {object} interaction discord interaction object
 * @param {object} playlist playlist object which contains tracks
 * @param {boolean} shuffle whether to shuffle queue or not before adding
 * @returns nothing
 */
async function queueTracks(interaction, playlist, shuffle) {
    const player = interaction.client.player

    const queue = await player.nodes.create(interaction.guild, {
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
    })

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

    let tracksJSON = playlist.tracks

    if (shuffle == true) {
        shuffleArray(tracksJSON)
    }

    const tracks = tracksJSON.map((track) => new Track(player, track)) //convert track data to track objects

    await queue.addTrack(tracks)

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
                .setTitle(`Queued: \`${playlist.name}\``)
                .setDescription(
                    `**Starting With**\n**[${tracks[0].title}](${tracks[0].url})**\nBy ${tracks[0].author} | ${tracks[0].duration}`
                )
                .setThumbnail(tracks[0].thumbnail)
                .setFooter({
                    text: `${interaction.user.username}`,
                    iconURL: interaction.user.avatarURL(),
                })
                .setTimestamp(),
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("pauseButton")
                        //.setLabel("Pause")
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji({
                            name: "Pause",
                            id: "1150516067983171755",
                        }) // Set emoji here using setEmoji
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`skipButton`)
                        //.setLabel(`Skip`)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji({
                            name: "Next",
                            id: "1150516100824571965",
                        })
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("shuffleButton")
                        //.setLabel(`Shuffle`)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji({
                            name: "Shuffle",
                            id: "1150515970432053249",
                        })
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`queueButton`)
                        .setLabel(`Queue`)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji({
                            name: "Queue",
                            id: "1150521944828039269",
                        })
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