import { Interaction, Events, ButtonInteraction } from "discord.js";
import MyClient from "../../utils/MyClient";
import Queue from "../../slash/music/queue";
import Play from "../../slash/music/play";

export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        const client = interaction.client as MyClient;

        if (interaction.isChatInputCommand()) {
            console.log(
                `{/} Interaction: ${interaction.commandName} | ${interaction.guild}`
            );
            //console.log(interaction.client)
            //console.log(client)

            const slashcmd = client.commands.get(interaction.commandName);
            if (!slashcmd)
                return interaction.reply("Not a valid slash command");

            await interaction.deferReply();
            await slashcmd.run(interaction);
        } else if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);

            try {
                await command?.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
        } else if (interaction.isButton()) {
            // console.log(interaction.customId)

            //await interaction.deferReply()

            const customId = interaction.customId.split("~")[0];
            console.log(`Button: ${customId} | ${interaction.guild}`);
            let command: string;

            //corrolate the customId to the command name
            switch (customId) {
                case "resumeButton":
                    command = "resume";
                    break;
                case "pauseButton":
                    command = "pause";
                    break;
                case "queueButton":
                    await interaction.deferReply();
                    var queueCommand = client.commands.get("queue") as Queue; //use var to avoid redeclaration
                    queueCommand.queueButton(interaction, 0, false);
                    return;
                case "skipButton":
                    command = "skip";
                    break;
                case "shuffleButton":
                    command = "shuffle";
                    break;
                case "refreshQueue":
                    var queueCommand = client.commands.get("queue") as Queue; //use var to avoid redeclaration
                    queueCommand.queueButton(interaction, 0, true);
                    return;
                default:
                    return;
            }

            await interaction.deferReply();
            await client.commands.get(command)?.button(interaction);
        } else if (interaction.isStringSelectMenu()) {
            const optionValue = interaction.values[0];
            const optionID = interaction.customId;
            console.log(`option: ${optionID} value: ${optionValue}`);
            if (optionID == "select") {
                await interaction.deferReply();
                let playCommand = client.commands.get("play") as Play;
                await playCommand.run(interaction);
            }
        } else {
            return;
        }
    },
};
