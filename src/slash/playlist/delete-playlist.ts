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

export class DeletePlaylist {
    private UserDoc: IUser | null
    private ServerDoc: IServer | null
    private playlistID: string | undefined

    constructor() {
        this.UserDoc = null
        this.ServerDoc = null
        this.playlistID = undefined
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
                            .setCustomId(
                                `deleteServerPL`
                            )
                            .setLabel(`Server`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(
                                `deleteUserPL`
                            )
                            .setLabel(`Personal`)
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
            })

            this.handleDuplicateCollector(reply, userPL, serverPL)
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
            return askConfirmDelete(
                interaction,
                serverPL._id?.toString(),
                serverPL.name
            )
        }

        if (userPL) {
            return askConfirmDelete(
                interaction,
                userPL._id?.toString(),
                userPL.name
            )
        }
    }

    async handleDuplicateCollector(reply: Message, userPL: IPlaylist, serverPL: IPlaylist) {
        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button
        })

        collector.on("collect", async (interaction) => {
            if (interaction.customId == "deleteServerPL" || interaction.customId == "deleteUserPL") {

                const isDeleteServer = interaction.customId == "deleteServerPL"
                this.playlistID = isDeleteServer ? serverPL._id?.toString() : userPL._id?.toString()
                this.askConfirmDelete(interaction, isDeleteServer ? this.ServerDoc : this.UserDoc, isDeleteServer ? serverPL : userPL)
            }
        }
    }

    async function askConfirmDelete(
        interaction: CommandInteraction | ButtonInteraction,
        playlist: IPlaylist | null
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


    }
    



    //search through both User and Server and delete the playlist with playlistID also check if interaction and playlist creater is the same
    /** deletes a playlist from the database using the playlistID
     * 
     * @param interaction 
     * @param playlistID 
     */
    async deleteButton(
        interaction: ButtonInteraction,
        playlistID: string
    ) {
        const userID = interaction.user.id


            let playlistIndex = user.playlists.findIndex(
                (playlist) => playlist._id?.toString() == playlistID
            )

            //if found in user
            if (playlistIndex > -1) {
                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle(
                                `Deleted: ${user.playlists[playlistIndex].name}`
                            ),
                    ],
                    components: [],
                })

                //delete doc if likes and playlist dont exist
                if (user.playlists.length == 0 && user.likes.length == 0) {
                    return await User.deleteOne({ _id: user._id })
                }

                return user.save()
            }

            return await checkServer(interaction)
        })

        /** checks the server document for the playlist and deletes it if found and the creater is the one who tries to
         *
         * @param {object} interaction discord interaction object
         */
        async function checkServer(interaction: ButtonInteraction) {
            const serverID = interaction.guild?.id

            await Server.findOne({ "server.ID": serverID }).then(
                async (server) => {
                    if (!server) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xff0000)
                                    .setTitle(
                                        "Only The Owner Of That Playlist Can Delete It!"
                                    ),
                            ],
                            components: [],
                        })
                    }

                    let playlistIndex = server.playlists.findIndex(
                        (playlist) => playlist._id?.toString() == playlistID
                    )

                    if (playlistIndex == -1) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xff0000)
                                    .setTitle(
                                        "Only The Owner Of That Playlist Can Delete It!"
                                    ),
                            ],
                            components: [],
                        })
                    }

                    //check to make sure only playlist owner can delete it
                    if (
                        server.playlists[playlistIndex].creater.ID !=
                        interaction.user.id
                    ) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xff0000)
                                    .setTitle(
                                        "Only The Owner Of That Playlist Can Delete It!"
                                    ),
                            ],
                        })
                    }
                    await interaction.update({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xff0000)
                                .setTitle(
                                    `Deleted: ${server.playlists[playlistIndex].name}`
                                ),
                        ],
                        components: [],
                    })

                    server.playlists.splice(playlistIndex, 1)

                    //delete server if no remaining playlists
                    if (server.playlists.length == 0) {
                        return await Server.deleteOne({ _id: server._id })
                    }

                    return server.save()
                }
            )
        }
    }
}

