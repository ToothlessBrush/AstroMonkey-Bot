import { useMainPlayer } from "discord-player";
import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    CommandInteraction,
} from "discord.js";

import { EmbedBuilder } from "@discordjs/builders";
import { SlashCommandBuilder } from "discord.js";

export default class Shuffle {
    constructor() {}

    data = new SlashCommandBuilder()
        .setName("shuffle")
        .setDescription("shuffles the music queue");

    /**
     * handles the slash interaction for shuffle command
     * @param {ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async run(interaction: ChatInputCommandInteraction) {
        this.handleShuffle(interaction);
    }

    /**
     * handles the button interaction for Shuffle
     * @param {ButtonInteraction} interaction
     * @returns {Promise<void>}
     */

    async button(interaction: ButtonInteraction) {
        this.handleShuffle(interaction);
    }

    /**
     * handles the shuffle command from slash command or button
     * @param {ChatInputCommandInteraction | ButtonInteraction} interaction
     * @returns {Promise<void>}
     */
    private async handleShuffle(
        interaction: ChatInputCommandInteraction | ButtonInteraction
    ): Promise<void> {
        const player = useMainPlayer();

        if (!player) {
            return;
        }

        if (!interaction.guildId) {
            return;
        }

        const queue = player.nodes.get(interaction.guildId);

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

        queue.tracks.shuffle();

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0)
                    .setTitle("**Shuffled the Queue**"),
            ],
        });
    }
}
