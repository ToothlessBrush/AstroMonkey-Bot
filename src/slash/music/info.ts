import { useMainPlayer, useQueue } from "discord-player"

import { SlashCommandBuilder } from "@discordjs/builders"
import {
    EmbedBuilder,
    CommandInteraction,
    ChatInputCommandInteraction,
} from "discord.js"

export default class Info {
    constructor() {}

    data = new SlashCommandBuilder()
        .setName("info")
        .setDescription("displays info of the current song")

    async run(interaction: ChatInputCommandInteraction) {
        if (!interaction) {
            return
        }
        if (interaction.isAutocomplete()) {
            return
        }
        const player = useMainPlayer()

        if (!player) {
            return
        }

        if (!interaction.guild) {
            return
        }

        const queue = useQueue(interaction.guild)

        if (!queue) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**No Song is Currently Playing!**`),
                ],
            })
        }

        const currentSong = queue.currentTrack

        let bar = queue.node.createProgressBar({
            queue: false,
            length: 12,
            indicator: "<:Purple_Dot_small:1151261471142060073>",
            leftChar: "<:Purple_Bar_small:1151261449105186857>",
            rightChar: "<:White_Bar_small:1151261505912840382>",
        })

        //let progressBar = `${queue.getPlayerTimestamp().current} **|**${bar}**|** ${queue.getPlayerTimestamp().end}`

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0) //purple
                    .setTitle(`Currently Playing`)
                    .setDescription(
                        currentSong
                            ? `[${currentSong.title}](${
                                  currentSong.url
                              })\n${bar}\n**Requested by: <@${
                                  currentSong.requestedBy?.id ??
                                  currentSong.requestedBy
                              }>**`
                            : "None"
                    ),
            ],
        })
    }
}
