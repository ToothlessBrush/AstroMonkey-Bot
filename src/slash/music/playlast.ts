import { SlashCommandBuilder } from "@discordjs/builders"
import { EmbedBuilder } from "discord.js"

module.exports = {
    data: new SlashCommandBuilder()
        .setName("playlast")
        .setDescription("Plays the Previously Played Song"),

    run: async ({ interaction }) => {
        const client = interaction.client
        const queue = client.player.nodes.get(interaction.guildId)

        if (!queue) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**No Music in Queue!**`),
                ],
            })
        }

        let embed = new EmbedBuilder()

        embed.setColor(0xa020f0)

        if (queue.history.previousTrack != null) {
            await queue.history.back()
            let song = queue.currentTrack
            embed
                .setTitle(`**Playing**`)
                .setDescription(`**[${song.title}](${song.url})**`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Duration: ${song.duration}` })
        } else {
            embed
                .setColor(0xff0000)
                .setDescription(`**There is no Previous Track**`)
        }

        await interaction.editReply({
            embeds: [embed],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("pauseButton")
                            //.setLabel("Pause")
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji({
                                name: "Pause",
                                id: "1150516067983171755",
                            }) // Set emoji here using setEmoji
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`skipButton`)
                            //.setLabel(`Skip`)
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji({
                                name: "Next",
                                id: "1150516100824571965",
                            })
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("shuffleButton")
                            //.setLabel(`Shuffle`)
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji({
                                name: "Shuffle",
                                id: "1150515970432053249",
                            })
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`queueButton`)
                            .setLabel(`Queue`)
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji({
                                name: "Queue",
                                id: "1150521944828039269",
                            })
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`like~${tracks[0].url}`)
                            .setLabel("Like")
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji({
                                name: "Heart",
                                id: "1150523515250942025",
                            })
                    ),
            ],
        })
    },
}
