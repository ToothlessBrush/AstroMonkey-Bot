import {
    ButtonBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
} from "@discordjs/builders"
import {
    ButtonStyle,
    ChatInputCommandInteraction,
    CommandInteraction,
    ComponentType,
    EmbedBuilder,
} from "discord.js"
import { Track, useQueue } from "discord-player"
import MyClient from "../../utils/MyClient"

export default class PlayLast {
    constructor() {}
    
    data = new SlashCommandBuilder()
        .setName("playlast")
        .setDescription("Plays the Previously Played Song")

    async run(interaction: ChatInputCommandInteraction) {
        const client = interaction.client as MyClient

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

        let embed = new EmbedBuilder()
        let components = new ActionRowBuilder<ButtonBuilder>()

        embed.setColor(0xa020f0)

        let song: Track | null
        if (queue.history.previousTrack != null) {
            await queue.history.back()
            song = queue.currentTrack
            embed
                .setTitle(`**Playing**`)
                .setDescription(`**[${song?.title}](${song?.url})**`)
                .setThumbnail(song?.thumbnail || null)
                .setFooter({ text: `Duration: ${song?.duration}` })

            components
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
                        .setCustomId(`like`)
                        .setLabel("Like")
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji({
                            name: "Heart",
                            id: "1150523515250942025",
                        })
                )
        } else {
            embed
                .setColor(0xff0000)
                .setDescription(`**There is no Previous Track**`)
        }

        const reply = await interaction.editReply({
            embeds: [embed],
            components: [components],
        })

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
        })

        collector.on(`collect`, (interaction) => {
            //only use collector for like
            if (interaction.customId != `like`) {
                return
            }

            client.commands.get(`like`).button(interaction, song)
        })
    }
}
