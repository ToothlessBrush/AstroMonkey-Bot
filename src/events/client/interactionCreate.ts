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
                case "refreshQueue":
                    client.commands.get("queue").button(interaction, 0, true)
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
