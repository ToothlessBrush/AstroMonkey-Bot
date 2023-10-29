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
    Message,
    ComponentType,
    InteractionResponse,
} from "discord.js"

import { Server, IServer } from "./../../model/Server.js"
import { User, IUser } from "./../../model/User.js"
import { IPlaylist } from "../../model/Playlist.js"
import { Schema } from "mongoose"

export default class DeletePlaylist {
    private UserDoc: IUser | null
    private ServerDoc: IServer | null

    constructor() {
        this.UserDoc = null
        this.ServerDoc = null
    }

    data = new SlashCommandBuilder()
        .setName("delete-playlist")
        .setDescription("delete a playlist")
        .addStringOption((option) =>
            option
                .setName("playlist")
                .setDescription("name of the playlist you want to delete")
                .setAutocomplete(true)
                .setRequired(true)
        )

    async autocomplete(interaction: AutocompleteInteraction) {
        const focusedValue = interaction.options.getFocused()
        let choices: string[] = []

        if (!interaction.guild?.id) {
            return
        }
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
        const playlistQuery = interaction.options.get("playlist")
            ?.value as string

        if (!interaction.guild?.id) {
            return
        }
        const serverID = interaction.guild.id
        const userID = interaction.user.id

        //check if playlist exists
        this.ServerDoc = await Server.findOne({ "server.ID": serverID })

        let serverPL: IPlaylist | undefined
        if (this.ServerDoc) {
            serverPL = this.ServerDoc.playlists.find(
                (playlist) => playlist.name == playlistQuery
            )
        }

        this.UserDoc = await User.findOne({ ID: userID })

        let userPL: IPlaylist | undefined
        if (this.UserDoc) {
            userPL = this.UserDoc.playlists.find(
                (playlist) => playlist.name == playlistQuery
            )
        }

        if (serverPL && userPL) {
            const reply = await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00cbb7)
                        .setTitle("Found 2 Playlists!")
                        .setDescription(
                            `There are 2 playlists named \`${serverPL.name}\`!\n\nWould you like to delete the server playlist or your personal playlist?`
                        ),
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`deleteServerPL`)
                            .setLabel(`Server`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`deleteUserPL`)
                            .setLabel(`Personal`)
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
            })

            return this.handleDuplicateCollector(reply, userPL, serverPL)
        }

        if (!serverPL && !userPL) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(`Playlist: \`${playlistQuery}\` Not Found!`),
                ],
            })
        }

        if (serverPL) {
            return this.askConfirmDelete(interaction, serverPL, this.ServerDoc)
        }

        if (userPL) {
            return this.askConfirmDelete(interaction, userPL, this.UserDoc)
        }
    }

    async handleDuplicateCollector(
        reply: Message,
        userPL: IPlaylist,
        serverPL: IPlaylist
    ) {
        const ServerDoc = this.ServerDoc
        const UserDoc = this.UserDoc

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
        })

        collector.on("collect", async (interaction) => {
            if (
                interaction.customId == "deleteServerPL" ||
                interaction.customId == "deleteUserPL"
            ) {
                const isDeleteServer = interaction.customId == "deleteServerPL"

                this.askConfirmDelete(
                    interaction,
                    isDeleteServer ? serverPL : userPL,
                    isDeleteServer ? ServerDoc : UserDoc
                )
            }

            collector.stop()
        })
    }

    /** asks the user to confirm if they want to delete the playlist
     *
     * @param interaction interaction to edit
     * @param playlist  playlist to delete
     * @param Schema the schema to delete the playlist from
     */
    async askConfirmDelete(
        interaction: CommandInteraction | ButtonInteraction,
        playlist: IPlaylist | null,
        Schema: IUser | IServer | null
    ) {
        const buttonInteraction = interaction.isButton()

        const askToConfirmEmbed = {
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle("Are You Sure?")
                    .setDescription(
                        `you are about to delete \`${playlist?.name}\`!\n\nPress Delete to Delete the Playlist!`
                    ),
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`DeletePL`)
                        .setLabel(`Delete`)
                        .setStyle(ButtonStyle.Danger)
                ),
            ],
        }

        let reply: Message | InteractionResponse
        if (buttonInteraction) {
            reply = await interaction.update(askToConfirmEmbed)
        } else {
            reply = await interaction.editReply(askToConfirmEmbed)
        }

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
        })

        collector.on("collect", async (interaction) => {
            if (interaction.customId == "DeletePL") {
                this.deletePlaylist(
                    interaction,
                    Schema,
                    playlist?._id?.toString()
                )
            }
        })
    }

    /** deletes a playlist from the database using the playlistID
     *
     * @param interaction interaction to edit
     * @param schema the schema to delete the playlist from
     */
    async deletePlaylist(
        interaction: ButtonInteraction,
        schema: IUser | IServer | null,
        playlistID: string | undefined
    ) {
        if (!schema) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(`Somthing Went Wrong!`),
                ],
            })
        }

        //check so that the interaction.user == playlist.creater.id before deleting
        const playlist = schema.playlists.find(
            (playlist) => playlist._id?.toString() == playlistID
        )
        if (playlist?.creater.ID != interaction.user.id) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(`You are not the creater of this playlist!`),
                ],
            })
        }

        //playlist without playlist with playlistID
        const updatedPlaylists = schema.playlists.filter(
            (playlist) => playlist._id?.toString() != playlistID
        )

        schema.playlists = updatedPlaylists

        try {
            await schema.save()
        } catch {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(`Somthing Went Wrong!`),
                ],
            })
        }

        return interaction.update({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x00cbb7)
                    .setTitle(`Deleted Playlist!`),
            ],
            components: [],
        })
    }
}
