import { SlashCommandBuilder, ActionRowBuilder } from "@discordjs/builders"
import {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    CommandInteraction,
    ChatInputCommandInteraction,
} from "discord.js"
import { useQueue } from "discord-player"

export default {
    data: new SlashCommandBuilder()
        .setName("pause")
        .setDescription("pauses the music queue"),

    run: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) {
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
        //calling queue.setPaused() causes queue to break

        //queue.playing

        queue.node.pause()

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0) //purple
                    .setTitle(`Paused`)
                    .setDescription(
                        `Click Resume or use /resume to resume the queue`
                    )
                    .setFooter({
                        text: `${interaction.user.username}`,
                        iconURL: interaction.user.avatarURL() || undefined,
                    })
                    .setTimestamp(),
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`resumeButton`)
                        .setLabel(`Resume`)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji({
                            name: "Play",
                            id: "1150516009778823289",
                        })
                ),
            ],
        }) //("Paused! Use /resume to resume")
        //queue.setPause()
    },
}
