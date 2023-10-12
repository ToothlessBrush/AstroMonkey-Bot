import { useMainPlayer } from "discord-player"
import { CommandInteraction } from "discord.js"

import { EmbedBuilder } from "@discordjs/builders"
import { SlashCommandBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName("shuffle")
        .setDescription("shuffles the music queue"),

    run: async ( interaction: CommandInteraction) => {
        const player = useMainPlayer()

        if (!player) {
            return
        }

        if (!interaction.guildId) {
            return
        }
        
        const queue = player.nodes.get(interaction.guildId)

        if (!queue) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**No Music in Queue!**`),
                ],
            })
        }

        queue.tracks.shuffle()

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0)
                    .setTitle("**Shuffled the Queue**"),
            ],
        })
    },
}
