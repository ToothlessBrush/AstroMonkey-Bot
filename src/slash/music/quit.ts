import { useQueue } from "discord-player"
import { ChatInputCommandInteraction, CommandInteraction } from "discord.js"

import { SlashCommandBuilder } from "@discordjs/builders"
import { EmbedBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName("quit")
        .setDescription("clears queue and stops bot"),

    run: async (interaction: ChatInputCommandInteraction) => {
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

        const used2 = process.memoryUsage().heapUsed / 1024 / 1024
        console.log(
            `The script uses approximately ${Math.round(used2 * 100) / 100} MB`
        )
    },
}
