import { useMainPlayer } from "discord-player"
import { ChatInputCommandInteraction, CommandInteraction } from "discord.js"

import { EmbedBuilder } from "@discordjs/builders"
import { SlashCommandBuilder } from "discord.js"

export default class Shuffle {
    constructor() {}

    data = new SlashCommandBuilder()
        .setName("shuffle")
        .setDescription("shuffles the music queue")

    async run(interaction: ChatInputCommandInteraction) {
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
    }
}
