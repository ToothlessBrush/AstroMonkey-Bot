import {
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    CommandInteraction,
    ComponentType,
    GuildMember,
} from "discord.js"

import { SlashCommandBuilder, ButtonBuilder } from "@discordjs/builders"
import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonStyle,
    PermissionsBitField,
} from "discord.js"
import path from "path"
import { Server } from "./../../model/Server.js"
import { User } from "./../../model/User.js"
import { Track, TrackJSON, useMainPlayer } from "discord-player"
import { IPlaylist } from "../../model/Playlist.js"
import mongoose from "mongoose"

export default class PlaylistNow {
    constructor() {}

    data = new SlashCommandBuilder()
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
        )

    async autocomplete(interaction: AutocompleteInteraction) {
        const focusedValue = interaction.options.getFocused()
        let choices = ["Likes"]
        await Server.findOne({ "server.ID": interaction.guild?.id }).then(
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
        function removeDuplicates<T>(arr: T[]): T[] {
            return arr.filter((item, index) => arr.indexOf(item) === index)
        }

        const filtered = choices.filter((choice) =>
            choice.startsWith(focusedValue)
        )

        filtered.slice(0, 25)

        await interaction.respond(
            filtered.map((choice) => ({ name: choice, value: choice }))
        )
    }

    async run(interaction: ChatInputCommandInteraction) {
        if (!(interaction.member instanceof GuildMember)) {
            return
        }

        if (!interaction.member?.voice.channel) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**You Must be in a VC!**`),
                ],
            })
        }

        if (!interaction.guild?.members.me) {
            return
        }

        //verify permission to connect
        const voiceChannelPermissions =
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

        const playlistName = interaction.options.get("playlist")
            ?.value as string
        const shuffle =
            (interaction.options.get("shuffle")?.value as boolean) || false

        const serverID = interaction.guild.id
        const userID = interaction.user.id

        if (playlistName == "Likes") {
            const likedTracks = await User.findOne({
                ID: interaction.user.id,
            }).then((user) => {
                if (!user) {
                    return
                }

                //log access date
                user.save()

                return user.likes
            })

            //build fake playlist object for function
            const playlist: IPlaylist = {
                name: "Likes",
                creater: {
                    name: interaction.user.username,
                    ID: interaction.user.id,
                },
                tracks: likedTracks || [],
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

            //log access date
            server.save()

            return server.playlists.find(
                (playlist) => playlist.name == playlistName
            )
            //log access time
        })

        const userPlaylist = await User.findOne({
            ID: userID,
        }).then(async (user) => {
            if (!user) {
                return
            }

            //log access date
            user.save()

            return user.playlists.find(
                (playlist) => playlist.name == playlistName
            )
        })

        if (serverPlaylist && userPlaylist) {
            const reply = await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00cbb7)
                        .setTitle("Found 2 Playlists!")
                        .setDescription(
                            `There are 2 playlists named \`${serverPlaylist.name}\`!\n\nWould you like to play the server playlist or your personal playlist?`
                        ),
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`serverPlaylistButton`)
                            .setLabel(`Server`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`userPlaylistButton`)
                            .setLabel(`Personal`)
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
            })

            const collector = reply.createMessageComponentCollector({
                componentType: ComponentType.Button,
            })

            collector.on(`collect`, async (interaction) => {
                const isServerPlaylist =
                    interaction.customId == `serverPlaylistButton`
                const isUserPlaylist =
                    interaction.customId == `userPlaylistButton`

                if (isServerPlaylist) {
                    await queueTracks(interaction, serverPlaylist, shuffle)
                } else if (isUserPlaylist) {
                    await queueTracks(interaction, userPlaylist, shuffle)
                }

                collector.stop()
            })

            return
        }

        const playlist = serverPlaylist || userPlaylist

        return await queueTracks(interaction, playlist, shuffle)
    }
}

/** queues tracks from playlist
 *
 * @param {object} interaction discord interaction object
 * @param {object} playlist playlist object which contains tracks
 * @param {boolean} shuffle whether to shuffle queue or not before adding
 * @returns nothing
 */
async function queueTracks(
    interaction: CommandInteraction | ButtonInteraction,
    playlist: IPlaylist | undefined,
    shuffle: boolean
) {
    const player = useMainPlayer()
    if (!player) {
        return
    }

    if (!interaction.guild) {
        return
    }

    const queue = player.nodes.create(interaction.guild, {
        metadata: {
            interaction: interaction,
            channel: interaction.channel,
            client: interaction.guild.members.me,
            requestedBy: interaction.user,
        },
        selfDeaf: true,
        volume: 80,
        leaveOnEmpty: true,
        leaveOnEnd: true,
    })

    const buttonInteraction = interaction.isButton() //if we update or reply

    if (!playlist) {
        const noPlaylistEmbed = {
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle(`playlist was not found!`),
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

    const tracks = tracksJSON.map(
        (trackData: TrackJSON) =>
            new Track(player, {
                title: trackData.title,
                author: trackData.author,
                url: trackData.url,
                thumbnail: trackData.thumbnail,
                duration: trackData.duration,
                views: trackData.views,
                requestedBy: interaction.user, //requested by interaction user instead of the user who added track to playlist
                description: trackData.description,
            })
    ) //convert track data to track objects

    const QUEUE_SIZE = queue.tracks.size

    queue.addTrack(tracks)

    queue.node.skipTo(QUEUE_SIZE)

    if (!(interaction.member instanceof GuildMember)) {
        return
    }

    if (!interaction.member.voice.channel) {
        return
    }

    try {
        //verify vc connection
        if (!queue.connection) {
            await queue.connect(interaction.member?.voice?.channel)
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
                    `**Starting With**\n**[${tracks[0].title}](${tracks[0].url})**\nBy ${tracks[0].author} | ${tracks[0].duration}`
                )
                .setThumbnail(tracks[0].thumbnail)
                .setFooter({
                    text: `${interaction.user.username}`,
                    iconURL: interaction.user.avatarURL() || undefined,
                })
                .setTimestamp(),
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>()
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
function shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[array[i], array[j]] = [array[j], array[i]]
    }
}
