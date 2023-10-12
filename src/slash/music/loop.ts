import { SlashCommandBuilder } from "@discordjs/builders"
import { QueueRepeatMode, useQueue } from "discord-player"
import { EmbedBuilder, CommandInteraction, ChatInputCommandInteraction } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName("loop")
        .setDescription("loops current song or queue")
        .addStringOption((option) =>
            option
                .setName("mode")
                .setDescription("the repeat mode you want")
                .setRequired(true)
                .addChoices(
                    { name: "OFF", value: "OFF" },
                    { name: "Queue", value: "QUEUE" },
                    { name: "Track", value: "TRACK" }
                )
        ),

    run: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) {
            //somethings gone horrible if this is true
            return
        }

        const queue = useQueue(interaction.guild)

        if (!queue) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**No Music in Queue!**`),
                ],
            })
        }

        const loopMode = interaction.options.get("mode")?.value as
            | string
            | undefined

        let embed = new EmbedBuilder()

        embed.setColor(0xa020f0)

        if (loopMode === "OFF") {
            queue.setRepeatMode(QueueRepeatMode.OFF)
            embed.setDescription(`**Stopped Looping**`)
        } else if (loopMode === `TRACK`) {
            queue.setRepeatMode(QueueRepeatMode.TRACK)
            embed.setDescription(`**Looping the Current Track**`)
        } else if (loopMode === `QUEUE`) {
            queue.setRepeatMode(QueueRepeatMode.QUEUE)
            embed.setDescription(`**Looping the Queue**`)
        }

        await interaction.editReply({
            embeds: [embed],
        })
    },
}
