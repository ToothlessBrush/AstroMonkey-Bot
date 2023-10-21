import { useQueue } from "discord-player"
import { ChatInputCommandInteraction, CommandInteraction } from "discord.js"

import { SlashCommandBuilder, ActionRowBuilder } from "@discordjs/builders"
import { EmbedBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName("resume")
        .setDescription("resumes the music queue"),

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
        queue.node.resume()

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0) //purple
                    .setTitle(`Resumed`)
                    .setDescription(
                        `Press Pause or use /pause to pause the queue`
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
                        .setCustomId(`pauseButton`)
                        .setLabel(`Pause`)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji({
                            name: "Pause",
                            id: "1150516067983171755",
                        })
                ),
            ],
        })

        //queue.setPause()
    },
}
