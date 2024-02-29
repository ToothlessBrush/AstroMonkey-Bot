import { useMainPlayer } from "discord-player";
import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    CommandInteraction,
} from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";
import { EmbedBuilder } from "discord.js";

import BaseCommand from "../../utils/BaseCommand";

export default class Skip extends BaseCommand {
    constructor() {
        super();
    }

    data = new SlashCommandBuilder()
        .setName("skip")
        .setDescription("skips the current song");

    /**
     * implementation slash interaction for skip command
     * @param {ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async run(interaction: ChatInputCommandInteraction) {
        this.handleSkip(interaction);
    }

    /**
     * handles the button interaction for Skip
     * @param {ButtonInteraction} interaction
     * @returns {Promise<void>}
     */

    async button(interaction: ButtonInteraction) {
        this.handleSkip(interaction);
    }

    /**
     * handles the skip command from slash command or button
     *
     * @param {ChatInputCommandInteraction | ButtonInteraction} interaction
     * @returns {Promise<void>}
     */
    private async handleSkip(
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

        const currentSong = queue.currentTrack;

        queue.node.skip();

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
        });
    }
}
