const { queueButton } = require("../../utils/queueButton")

module.exports = {
    name: "interactionCreate",
    async execute(interaction) {
        const client = interaction.client

        if (interaction.isChatInputCommand()) {
            console.log(`Interaction: ${interaction.commandName}`)
            //console.log(interaction.client)
            //console.log(client)

            const slashcmd = client.slashcommands.get(interaction.commandName)
            if (!slashcmd) return interaction.reply("Not a valid slash command")

            await interaction.deferReply()
            await slashcmd.run({ client, interaction })
        } else if (interaction.isAutocomplete()) {
            const command = client.slashcommands.get(interaction.commandName)
            if (!command) return interaction.reply("Not a valid slash command")

            try {
                await command.autocomplete({ client, interaction })
            } catch (error) {
                console.error(error)
            }
        } else if (interaction.isButton()) {
            // console.log(interaction.customId)

            //await interaction.deferReply()

            const customId = interaction.customId.split("_")[0]
            console.log(`Button: ${customId}`)
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
                    queueButton(client, interaction, 0, false)
                    return
                case "skipButton":
                    command = "skip"
                    break
                case "nextPageButton":
                    queueButton(
                        client,
                        interaction,
                        parseInt(interaction.customId.split("_")[1]),
                        true
                    )
                    //console.log(interaction.customId.split("_")[1])
                    return
                case "refreshQueue":
                    queueButton(client, interaction, 0, true)
                    return
                case "prevPageButton":
                    queueButton(
                        client,
                        interaction,
                        parseInt(interaction.customId.split("_")[1]),
                        true
                    ) //console.log(interaction.customId.split("_")[1])
                    return
                case "serverPlaylistButton":
                    client.slashcommands
                        .get("queue-playlist")
                        .buttons(
                            interaction,
                            "server",
                            interaction.customId.split("_")[1],
                            interaction.customId.split("_")[2]
                        )
                    return
                case "userPlaylistButton":
                    client.slashcommands
                        .get("queue-playlist")
                        .buttons(
                            interaction,
                            "user",
                            interaction.customId.split("_")[1],
                            interaction.customId.split("_")[2]
                        )
                    return
                case "addServerPL":
                    client.slashcommands
                        .get("playlist-add")
                        .buttons(
                            interaction,
                            "server",
                            interaction.customId.split("_")[1],
                            interaction.customId.split("_")[2]
                        )
                    return
                case "addUserPL":
                    client.slashcommands
                        .get("playlist-add")
                        .buttons(
                            interaction,
                            "user",
                            interaction.customId.split("_")[1],
                            interaction.customId.split("_")[2]
                        )
                    return
                default:
                    return
            }

            await interaction.deferReply()
            await client.slashcommands.get(command).run({ client, interaction })
        } else if (interaction.isStringSelectMenu()) {
            const optionValue = interaction.values[0]
            const optionID = interaction.customId
            console.log(`option: ${optionID} value: ${optionValue}`)
            if (optionID == "select") {
                await interaction.deferReply()
                await client.slashcommands
                    .get("play")
                    .run({ client, interaction })
            }
        } else {
            return
        }
    },
}
