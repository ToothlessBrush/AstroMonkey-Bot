import {
    EmbedBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CommandInteraction,
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    InteractionResponse,
    Message,
    ComponentType,
} from "discord.js"

import { Server } from "./../../model/Server.js"
import { User } from "./../../model/User.js"
import { IPlaylist } from "../../model/Playlist.js"

export default class ViewPlaylist {
    playlist: IPlaylist | undefined

    constructor() {
        this.playlist = undefined
    }

    data = new SlashCommandBuilder()
        .setName("view-playlist")
        .setDescription("view the contents of a playlist")
        .addStringOption((option) =>
            option
                .setName("playlist")
                .setDescription("name of the playlists you would like to view")
                .setAutocomplete(true)
                .setRequired(true)
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

        await interaction.respond(
            filtered.map((choice) => ({ name: choice, value: choice }))
        )
    }

    async run(interaction: ChatInputCommandInteraction) {
        const serverID = interaction.guild?.id
        const userID = interaction.user.id
        const playlistName = interaction.options.get("playlist")
            ?.value as string

        if (playlistName == "Likes") {
            const likedTracks =
                (await User.findOne({ ID: userID }).then((user) => {
                    if (!user) {
                        return
                    }

                    return user.likes
                })) || []

            this.playlist = {
                name: "Likes",
                creater: {
                    name: interaction.user.username,
                    ID: interaction.user.id,
                },
                tracks: likedTracks,
            }

            return this.showTracks(interaction)
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
            const reply = await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00cbb7)
                        .setTitle("Found 2 Playlists!")
                        .setDescription(
                            `There are 2 playlists named \`${serverPL.name}\`!\n\nWould you like to view the server playlist or your personal playlist?`
                        ),
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`showServerPL`)
                            .setLabel(`Server`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`showUserPL`)
                            .setLabel(`Personal`)
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
            })

            return this.handleDuplicateButton(reply, serverPL, userPL)
        }

        this.playlist = serverPL || userPL

        this.showTracks(interaction)
    }

    private async handleDuplicateButton(
        reply: Message,
        serverPL: IPlaylist,
        userPL: IPlaylist
    ) {
        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
        })

        collector.on(`collect`, (interaction) => {
            const isServerPL = interaction.customId == `showServerPL`
            this.playlist = isServerPL ? serverPL : userPL //set the playlist to the one specifed
            this.showTracks(interaction)
            collector.stop()
        })
    }

    private async showTracks(
        interaction: CommandInteraction | ButtonInteraction
    ) {
        const buttonInteraction = interaction.isButton()
        const playlist = this.playlist

        if (!playlist) {
            const noPlaylistEmbed = {
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(`Playlist was not found!`),
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
            .slice()
            .map((track, i) => {
                return `**${i + 1}.** \`[${track.duration}]\` [${
                    track.title
                }](${track.url})\n**Added By: <@${track.requestedBy}>**`
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

        let reply: InteractionResponse | Message
        try {
            if (buttonInteraction) {
                reply = await interaction.update(viewPlaylistEmbed)
            } else {
                reply = await interaction.editReply(viewPlaylistEmbed)
            }
        } catch (e) {
            console.error(e)
        }
    }
}
