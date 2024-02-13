import { SlashCommandBuilder } from "@discordjs/builders"
import {
    EmbedBuilder,
    CommandInteraction,
    ChatInputCommandInteraction,
} from "discord.js"

export default class ping {
    constructor() {}

    data = new SlashCommandBuilder()
        .setName("ping")
        .setDescription("replies with the latency of the bot")

    async run(interaction: ChatInputCommandInteraction) {
        if (interaction.isAutocomplete()) {
            return
        }

        const client = interaction.client

        const mesg = await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(0xa020f0).setTitle(`Pong!`)],
        })

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0) //purple
                    .setTitle(`Pong!`)
                    .setDescription(
                        `Bot Latency: \`${
                            mesg.createdTimestamp - interaction.createdTimestamp
                        }ms\`, \nWebsocket Latency: \`${client.ws.ping}ms\``
                    ),
            ],
        })
    }
}
