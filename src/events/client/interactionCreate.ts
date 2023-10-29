import { Interaction, Events } from "discord.js"
import MyClient from "../../utils/MyClient"

export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        const client = interaction.client as MyClient

        if (interaction.isChatInputCommand()) {
            console.log(
                `{/} Interaction: ${interaction.commandName} | ${interaction.guild}`
            )
            //console.log(interaction.client)
            //console.log(client)

            const slashcmd = client.commands.get(interaction.commandName)
            if (!slashcmd) return interaction.reply("Not a valid slash command")

            await interaction.deferReply()
            await slashcmd.run(interaction)
        } else if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName)

            try {
                await command.autocomplete(interaction)
            } catch (error) {
                console.error(error)
            }
        } else if (interaction.isButton()) {
            // console.log(interaction.customId)

            //await interaction.deferReply()

            const customId = interaction.customId.split("~")[0]
            console.log(`Button: ${customId} | ${interaction.guild}`)
            let command

            switch (customId) {
                case "resumeButton":
                    command = "resume"
                    break
                case "pauseButton":
                    command = "pause"
                    break
                case "queueButton":
                    await interaction.deferReply()
                    client.commands.get("queue").button(interaction, 0, false)
                    return
                case "skipButton":
                    command = "skip"
                    break
                case "shuffleButton":
                    command = "shuffle"
                    break
                case "nextPageButton":
                    client.commands
                        .get("queue")
                        .button(
                            interaction,
                            parseInt(interaction.customId.split("~")[1]),
                            true
                        )
                    //console.log(interaction.customId.split("~")[1])
                    return
                case "refreshQueue":
                    client.commands.get("queue").button(interaction, 0, true)
                    return
                case "prevPageButton":
                    client.commands
                        .get("queue")
                        .button(
                            interaction,
                            parseInt(interaction.customId.split("~")[1]),
                            true
                        ) //console.log(interaction.customId.split("~")[1])
                    return
                case "serverPlaylistButton":
                    client.commands
                        .get("queue-playlist")
                        .buttons(
                            interaction,
                            "server",
                            interaction.customId.split("~")[1],
                            interaction.customId.split("~")[2]
                        )
                    return
                case "userPlaylistButton":
                    client.commands
                        .get("queue-playlist")
                        .buttons(
                            interaction,
                            "user",
                            interaction.customId.split("~")[1],
                            interaction.customId.split("~")[2]
                        )
                    return
                // case "addServerPL":
                //     client.slashcommands
                //         .get("playlist-add")
                //         .buttons(
                //             interaction,
                //             "server",
                //             interaction.customId.split("~")[1],
                //             interaction.customId.split("~")[2]
                //         )
                //     return
                // case "addUserPL":
                //     client.slashcommands
                //         .get("playlist-add")
                //         .buttons(
                //             interaction,
                //             "user",
                //             interaction.customId.split("~")[1],
                //             interaction.customId.split("~")[2]
                //         )
                //     return
                // case "showServerPL":
                //     client.commands
                //         .get("view-playlist")
                //         .buttons(
                //             interaction,
                //             "server",
                //             interaction.customId.split("~")[1]
                //         )
                //     return
                // case "showUserPL":
                //     client.commands
                //         .get("view-playlist")
                //         .buttons(
                //             interaction,
                //             "user",
                //             interaction.customId.split("~")[1]
                //         )
                //     return
                // case "removeUserPL":
                //     client.slashcommands
                //         .get("playlist-remove")
                //         .buttons(
                //             interaction,
                //             "user",
                //             interaction.customId.split("~")[1],
                //             interaction.customId.split("~")[2]
                //         )
                //     return
                // case "removeServerPL":
                //     client.slashcommands
                //         .get("playlist-remove")
                //         .buttons(
                //             interaction,
                //             "server",
                //             interaction.customId.split("~")[1],
                //             interaction.customId.split("~")[2]
                //         )
                //     return
                // case "deleteServerPL":
                //     client.commands
                //         .get("delete-playlist")
                //         .duplicateButton(
                //             interaction,
                //             "server",
                //             interaction.customId.split("~")[1]
                //         )
                //     return
                // case "deleteUserPL":
                //     client.commands
                //         .get("delete-playlist")
                //         .duplicateButton(
                //             interaction,
                //             "user",
                //             interaction.customId.split("~")[1]
                //         )
                //     return
                // case "DeletePL":
                //     client.commands
                //         .get("delete-playlist")
                //         .deleteButton(
                //             interaction,
                //             interaction.customId.split("~")[1]
                //         )
                //     return
                // case "like":
                //     await interaction.deferReply()
                //     client.slashcommands.get("like").run(interaction)
                //     return
                case "deleteUser":
                    await interaction.deferReply()
                    client.commands
                        .get("purge-info")
                        .buttons(
                            interaction,
                            interaction.customId.split("~")[1]
                        )
                    return
                default:
                    return
            }

            await interaction.deferReply()
            await client.commands.get(command).run(interaction)
        } else if (interaction.isStringSelectMenu()) {
            const optionValue = interaction.values[0]
            const optionID = interaction.customId
            console.log(`option: ${optionID} value: ${optionValue}`)
            if (optionID == "select") {
                await interaction.deferReply()
                await client.commands.get("play").run(interaction)
            }
        } else {
            return
        }
    },
}
