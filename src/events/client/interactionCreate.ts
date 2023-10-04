module.exports = {
    name: "interactionCreate",
    async execute(interaction) {
        const client = interaction.client

        if (interaction.isChatInputCommand()) {
            console.log(
                `{/} Interaction: ${interaction.commandName} | ${interaction.guild}`
            )
            //console.log(interaction.client)
            //console.log(client)

            const slashcmd = client.slashcommands.get(interaction.commandName)
            if (!slashcmd) return interaction.reply("Not a valid slash command")

            await interaction.deferReply()
            await slashcmd.run({ interaction })
        } else if (interaction.isAutocomplete()) {
            const command = client.slashcommands.get(interaction.commandName)
            if (!command) return interaction.reply("Not a valid slash command")

            try {
                await command.autocomplete({ interaction })
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
                    client.slashcommands
                        .get("queue")
                        .button(interaction, 0, false)
                    return
                case "skipButton":
                    command = "skip"
                    break
                case "shuffleButton":
                    command = "shuffle"
                    break
                case "nextPageButton":
                    client.slashcommands
                        .get("queue")
                        .button(
                            interaction,
                            parseInt(interaction.customId.split("~")[1]),
                            true
                        )
                    //console.log(interaction.customId.split("~")[1])
                    return
                case "refreshQueue":
                    client.slashcommands
                        .get("queue")
                        .button(interaction, 0, true)
                    return
                case "prevPageButton":
                    client.slashcommands
                        .get("queue")
                        .button(
                            interaction,
                            parseInt(interaction.customId.split("~")[1]),
                            true
                        ) //console.log(interaction.customId.split("~")[1])
                    return
                case "serverPlaylistButton":
                    client.slashcommands
                        .get("queue-playlist")
                        .buttons(
                            interaction,
                            "server",
                            interaction.customId.split("~")[1],
                            interaction.customId.split("~")[2]
                        )
                    return
                case "userPlaylistButton":
                    client.slashcommands
                        .get("queue-playlist")
                        .buttons(
                            interaction,
                            "user",
                            interaction.customId.split("~")[1],
                            interaction.customId.split("~")[2]
                        )
                    return
                case "addServerPL":
                    client.slashcommands
                        .get("playlist-add")
                        .buttons(
                            interaction,
                            "server",
                            interaction.customId.split("~")[1],
                            interaction.customId.split("~")[2]
                        )
                    return
                case "addUserPL":
                    client.slashcommands
                        .get("playlist-add")
                        .buttons(
                            interaction,
                            "user",
                            interaction.customId.split("~")[1],
                            interaction.customId.split("~")[2]
                        )
                    return
                case "showServerPL":
                    client.slashcommands
                        .get("view-playlist")
                        .buttons(
                            interaction,
                            "server",
                            interaction.customId.split("~")[1]
                        )
                    return
                case "showUserPL":
                    client.slashcommands
                        .get("view-playlist")
                        .buttons(
                            interaction,
                            "user",
                            interaction.customId.split("~")[1]
                        )
                    return
                case "removeUserPL":
                    client.slashcommands
                        .get("playlist-remove")
                        .buttons(
                            interaction,
                            "user",
                            interaction.customId.split("~")[1],
                            interaction.customId.split("~")[2]
                        )
                    return
                case "removeServerPL":
                    client.slashcommands
                        .get("playlist-remove")
                        .buttons(
                            interaction,
                            "server",
                            interaction.customId.split("~")[1],
                            interaction.customId.split("~")[2]
                        )
                    return
                case "deleteServerPL":
                    client.slashcommands
                        .get("delete-playlist")
                        .duplicateButton(
                            interaction,
                            "server",
                            interaction.customId.split("~")[1]
                        )
                    return
                case "deleteUserPL":
                    client.slashcommands
                        .get("delete-playlist")
                        .duplicateButton(
                            interaction,
                            "user",
                            interaction.customId.split("~")[1]
                        )
                    return
                case "DeletePL":
                    client.slashcommands
                        .get("delete-playlist")
                        .deleteButton(
                            interaction,
                            interaction.customId.split("~")[1]
                        )
                    return
                case "like":
                    await interaction.deferReply()
                    client.slashcommands.get("like").run({ interaction })
                    return
                default:
                    return
            }

            await interaction.deferReply()
            await client.slashcommands.get(command).run({ interaction })
        } else if (interaction.isStringSelectMenu()) {
            const optionValue = interaction.values[0]
            const optionID = interaction.customId
            console.log(`option: ${optionID} value: ${optionValue}`)
            if (optionID == "select") {
                await interaction.deferReply()
                await client.slashcommands.get("play").run({ interaction })
            }
        } else {
            return
        }
    },
}
