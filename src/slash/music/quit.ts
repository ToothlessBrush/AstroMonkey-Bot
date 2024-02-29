import { useQueue } from "discord-player";
import { ChatInputCommandInteraction, CommandInteraction } from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";
import { EmbedBuilder } from "discord.js";

import BaseCommand from "../../utils/BaseCommand";

export default class Quit extends BaseCommand {
    constructor() {
        super();
    }

    data = new SlashCommandBuilder()
        .setName("quit")
        .setDescription("clears queue and stops bot");

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
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

        queue.delete();

        await interaction.editReply({
            embeds: [
                new EmbedBuilder().setColor(0xff0000).setTitle(`**Quitting**`),
            ],
        });
    }
}
