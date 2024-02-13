import { useQueue } from "discord-player"
import { ChatInputCommandInteraction, CommandInteraction } from "discord.js"

import { SlashCommandBuilder } from "@discordjs/builders"
import { EmbedBuilder } from "discord.js"

export default class Quit {
    constructor() {}

    data = new SlashCommandBuilder()
        .setName("quit")
        .setDescription("clears queue and stops bot")

    async run(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            return
        }

        const queue = useQueue(interaction.guild)

        if (!queue)
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**No Music in Queue!**`),
                ],
            })

        queue.delete()

        await interaction.editReply({
            embeds: [
                new EmbedBuilder().setColor(0xff0000).setTitle(`**Quitting**`),
            ],
        })
    }
}
