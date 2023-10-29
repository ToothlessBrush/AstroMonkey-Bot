import {
    EmbedBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Embed,
    ButtonInteraction,
    CommandInteraction,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    ComponentType,
} from "discord.js"

import { Server, IServer } from "./../../model/Server.js"
import { IUser, User } from "./../../model/User.js"
import { IPlaylist } from "../../model/Playlist.js"

export default class PlaylistRemove {
    constructor() {}

    data = new SlashCommandBuilder()
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
        )

    async autocomplete(interaction: AutocompleteInteraction) {
        const focusedOption = interaction.options.getFocused(true)

        let choices = []
        if (focusedOption.name == "playlist") {
            choices.push("Likes")
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
        }

        if (focusedOption.name == "track") {
            const playlistName = interaction.options.get(`playlist`)
                ?.value as string //hope this will work

            //const playlistName = interaction.options._hoistedOptions[0].value

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

            await Server.findOne({ "server.ID": interaction.guild?.id }).then(
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
        function removeDuplicates<T>(arr: T[]) {
            return arr.filter((item, index) => arr.indexOf(item) === index)
        }

        const filtered = choices.filter((choice) =>
            choice.startsWith(focusedOption.value)
        )

        filtered.slice(0, 25)

        return await interaction.respond(
            filtered.map((choice) => ({ name: choice, value: choice }))
        )
    }

    async run(interaction: ChatInputCommandInteraction) {
        const playlistName = interaction.options.get("playlist")
            ?.value as string
        const query = interaction.options.get("track")?.value as string
        const serverID = interaction.guild?.id
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
        let serverPL: IPlaylist | undefined
        if (server) {
            serverPL = server.playlists.find(
                (playlist) => playlist.name == playlistName
            )
        }

        const user = await User.findOne({ ID: userID })
        let userPL: IPlaylist | undefined
        if (user) {
            userPL = user.playlists.find(
                (playlist) => playlist.name == playlistName
            )
        }

        if (serverPL && userPL) {
            const reply = await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00cbb7)
                        .setTitle("Found 2 Playlists!")
                        .setDescription(
                            `There are 2 playlists named \`${serverPL.name}\`!\n\nWould you like to remove the track from the server playlist or your personal playlist?`
                        ),
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`removeServerPL`)
                            .setLabel(`Server`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`removeUserPL`)
                            .setLabel(`Personal`)
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
            })

            const collector = reply.createMessageComponentCollector({
                componentType: ComponentType.Button,
            })

            collector.on(`collect`, (interaction) => {
                const isRemoveServerPL =
                    interaction.customId == `removeServerPL`
                this.button(
                    interaction,
                    isRemoveServerPL ? server : user,
                    isRemoveServerPL ? serverPL : userPL,
                    query
                )
            })
            return
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

        if (serverPL && server) {
            removeTrack(interaction, serverPL, query)
            server.save()
        }

        if (userPL && user) {
            removeTrack(interaction, userPL, query)
            user.save()
        }
    }

    /**
     *
     * @param interaction | ButtonInteraction
     * @param schema IUser | IServer | null
     * @param playlist IPlaylist | undefined
     * @param query string
     * @returns void
     */
    async button(
        interaction: ButtonInteraction,
        schema: IUser | IServer | null,
        playlist: IPlaylist | undefined,
        query: string
    ) {
        if (!schema) {
            return interaction.reply({
                content: "Playlist Data Not Found!",
                embeds: [],
                components: [],
            })
        }

        if (!playlist) {
            return interaction.reply({
                content: "Playlist Data Not Found!",
                embeds: [],
                components: [],
            })
        }

        removeTrack(interaction, playlist, query)

        if (`save` in schema) {
            try {
                await schema.save()
            } catch (error) {
                console.error(error)
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle(`Somthing went wrong!`),
                    ],
                })
            }
        }
    }
}

/** searches and removes track from a playlist (doesnt save db)
 *
 * @param {object} interaction discordjs interaction
 * @param {object} playlist the playlist object to remove track from
 * @param {String} query the name of track to remove
 * @returns {void} points to playlist array
 */
async function removeTrack(
    interaction: CommandInteraction | ButtonInteraction,
    playlist: IPlaylist,
    query: string
): Promise<void> {
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
            await interaction.update(noTrackFoundEmbed)
            return
        } else {
            await interaction.editReply(noTrackFoundEmbed)
            return
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
        await interaction.update(removedTrackEmbed)
        return
    } else {
        await interaction.editReply(removedTrackEmbed)
        return
    }
}
