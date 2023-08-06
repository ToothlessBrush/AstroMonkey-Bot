const {
    EmbedBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    InteractionType,
} = require("discord.js")

const mongoose = require("mongoose")
const Server = require("./../../model/server")
const User = require("./../../model/User")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delete-playlist")
        .setDescription("delete a playlist")
        .addStringOption((option) =>
            option
                .setName("playlist")
                .setDescription("name of the playlist you want to delete")
                .setAutocomplete(true)
                .setRequired(true)
        ),
    autocomplete: async ({ client, interaction }) => {
        const focusedValue = interaction.options.getFocused()
        let choices = []
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
        const playlistQuery = interaction.options.getString("playlist")
        const serverID = interaction.guild.id
        const userID = interaction.user.id

        //check if playlist exists
        const server = await Server.findOne({ "server.ID": serverID })

        let serverPL
        if (server) {
            serverPL = server.playlists.find(
                (playlist) => playlist.name == playlistQuery
            )
        }

        const user = await User.findOne({ ID: userID })

        let userPL
        if (user) {
            userPL = user.playlists.find(
                (playlist) => playlist.name == playlistQuery
            )
        }

        if (serverPL && userPL) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00cbb7)
                        .setTitle("Found 2 Playlists!")
                        .setDescription(
                            `There are 2 playlists named \`${serverPL.name}\`!\n\nWould you like to delete the server playlist or your personal playlist?`
                        ),
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `deleteServerPL_${serverPL._id.toString()}`
                            )
                            .setLabel(`Server`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(
                                `deleteUserPL_${userPL._id.toString()}`
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
                        .setTitle(`Playlist: \`${playlistName}\` Not Found!`),
                ],
            })
        }

        if (serverPL) {
            return askConfirmDelete(
                interaction,
                serverPL._id.toString(),
                serverPL.name
            )
        }

        if (userPL) {
            return askConfirmDelete(
                interaction,
                userPL._id.toString(),
                userPL.name
            )
        }
    },

    duplicateButton: async (interaction, docType, playlistID) => {
        const serverID = interaction.guild.id
        const userID = interaction.user.id

        let playlist
        //get PlaylistName
        if (docType == "user") {
            playlist = await User.findOne({ ID: userID }).then((user) => {
                if (!user) {
                    return interaction.update({
                        content: "User Data Not Found!",
                    })
                }
                return user.playlists.find(
                    (playlist) => playlist._id.toString() == playlistID
                )
            })
        } else if (docType == "server") {
            playlist = await Server.findOne({ "server.ID": serverID }).then(
                (server) => {
                    if (!server) {
                        return interaction.update({
                            content: "Server Data Not Found!",
                        })
                    }
                    return server.playlists.find(
                        (playlist) => playlist._id.toString() == playlistID
                    )
                }
            )
        }

        if (!playlist) {
            return interaction.update({
                content: "Playlist Data Not Found",
                embeds: [],
                components: [],
            })
        }

        await askConfirmDelete(interaction, playlistID, playlist.name)
    },

    //search through both User and Server and delete the playlist with playlistID also check if interaction and playlist creater is the same
    deleteButton: async (interaction, playlistID) => {
        const userID = interaction.user.id

        await User.findOne({ ID: userID }).then(async (user) => {
            if (!user) {
                return await checkServer(interaction)
            }

            let playlistIndex = user.playlists.findIndex(
                (playlist) => playlist._id.toString() == playlistID
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

                user.playlists.splice(playlistIndex, 1)

                return user.save()
            }

            return await checkServer(interaction)
        })

        /** checks the server document for the playlist and deletes it if found and the creater is the one who tries to
         * 
         * @param {object} interaction discord interaction object
         */
        async function checkServer(interaction) {
            const serverID = interaction.guild.id

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
                        (playlist) => playlist._id.toString() == playlistID
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

                    return server.save()
                }
            )
        }
    },
}

/** build a confirm to delete embed
 *
 * @param {object} interaction discord Interaction
 * @param {String} playlistID ID of playlist to delete
 * @param {String} playlistName name of playlist to delete
 * @returns
 */
async function askConfirmDelete(interaction, playlistID, playlistName) {
    const buttonInteraction = interaction.isButton()

    const askToConfirmEmbed = {
        embeds: [
            new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle("Are You Sure?")
                .setDescription(
                    `you are about to delete \`${playlistName}\`!\n\nPress Delete to Delete the Playlist!`
                ),
        ],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`DeletePL_${playlistID}`)
                    .setLabel(`Delete`)
                    .setStyle(ButtonStyle.Danger)
            ),
        ],
    }

    if (buttonInteraction) {
        return interaction.update(askToConfirmEmbed)
    } else {
        return interaction.editReply(askToConfirmEmbed)
    }
}
