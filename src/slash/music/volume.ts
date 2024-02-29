import { EmbedBuilder } from "@discordjs/builders";
import { useQueue } from "discord-player";
import {
    ChatInputCommandInteraction,
    CommandInteraction,
    SlashCommandBuilder,
} from "discord.js";
import BaseCommand from "../../utils/BaseCommand";

export default class Volume extends BaseCommand {
    constructor() {
        super();
    }

    data = new SlashCommandBuilder()
        .setName("volume")
        .setDescription("change the volume of the music")
        .addNumberOption((option) =>
            option
                .setName("volume")
                .setDescription(
                    "The volume percentage you would like to set to"
                )
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        );

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
                        .setDescription(`**no song is currently playing**`),
                ],
            });
            return;
        }

        const volume = interaction.options.get("volume")?.value as number;

        queue.node.setVolume(volume);

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0)
                    .setTitle(`Volume set to \`${volume}%\``),
            ],
        });
    }
}
