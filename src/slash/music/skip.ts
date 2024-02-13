import { useMainPlayer } from "discord-player"
import { ChatInputCommandInteraction, CommandInteraction } from "discord.js"

import { SlashCommandBuilder } from "@discordjs/builders"
import { EmbedBuilder } from "discord.js"

export default class Skip {
    constructor() {}

    data = new SlashCommandBuilder()
        .setName("skip")
        .setDescription("skips the current song")

    async run(interaction: ChatInputCommandInteraction) {
        const player = useMainPlayer()

        if (!player) {
            return
        }

        if (!interaction.guildId) {
            return
        }

        const queue = player.nodes.get(interaction.guildId)

        if (!queue)
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**No Music in Queue!**`),
                ],
            })

        const currentSong = queue.currentTrack

        queue.node.skip()

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0)
                    .setDescription(
                        `**Skipped** [${currentSong?.title}](${currentSong?.url})`
                    )
                    .setFooter({
                        text: `${interaction.user.username}`,
                        iconURL: interaction.user.avatarURL() || undefined,
                    })
                    .setTimestamp(),
            ],
        })
    }
}
