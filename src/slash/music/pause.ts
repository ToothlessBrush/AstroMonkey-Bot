import { SlashCommandBuilder, ActionRowBuilder } from "@discordjs/builders";
import {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ButtonInteraction,
} from "discord.js";
import { useQueue } from "discord-player";

import BaseCommand from "../../utils/BaseCommand";

export default class Pause extends BaseCommand {
    constructor() {
        super();
    }

    data = new SlashCommandBuilder()
        .setName("pause")
        .setDescription("pauses the music queue");

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        this.handlePause(interaction);
    }

    async button(interaction: ButtonInteraction) {
        this.handlePause(interaction);
    }

    private async handlePause(
        interaction: ChatInputCommandInteraction | ButtonInteraction
    ) {
        if (!interaction.guild) {
            return;
        }

        const queue = useQueue(interaction.guild);

        if (!queue) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**No Music in Queue!**`),
                ],
            });
            return;
        }
        //calling queue.setPaused() causes queue to break

        //queue.playing

        queue.node.pause();

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
        });
    }
}
