import { useQueue } from "discord-player";
import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    CommandInteraction,
} from "discord.js";

import { SlashCommandBuilder, ActionRowBuilder } from "@discordjs/builders";
import { EmbedBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

import BaseCommand from "../../utils/BaseCommand";

export default class Resume extends BaseCommand {
    constructor() {
        super();
    }

    /**
     * data for the slash command
     */
    data = new SlashCommandBuilder()
        .setName("resume")
        .setDescription("resumes the music queue");

    /**
     *
     * @param interaction chat input command interaction from slash command
     */
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        this.handleResume(interaction);
    }

    /**
     *
     * @param interaction button interaction from button
     */
    async button(interaction: ButtonInteraction) {
        this.handleResume(interaction);
    }

    /**
     * handles the resume command from slash command or button
     *
     * @param interaction chat input command interaction from slash command or button interaction from button
     * @returns void
     */
    private async handleResume(
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
        queue.node.resume();

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
        });
    }
}
