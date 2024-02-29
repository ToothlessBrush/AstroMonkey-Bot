import {
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    SlashCommandBuilder,
} from "discord.js";
import { User } from "./../../model/User";
import {
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
} from "@discordjs/builders";

import BaseCommand from "../../utils/BaseCommand";

export default class PurgeInfo extends BaseCommand {
    constructor() {
        super();
    }

    data = new SlashCommandBuilder()
        .setName("purge-info")
        .setDescription("Remove all your discord info from the database");

    async run(interaction: ChatInputCommandInteraction) {
        User.findOne({ ID: interaction.user.id }).then(async (user) => {
            if (!user) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`**No info found**`)
                            .setColor(0xff0000),
                    ],
                });
            }

            const reply = await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(
                            `**Are you sure you want to delete your info?**`
                        )
                        .setDescription(
                            `This will delete all your playlists and likes **permanently**.`
                        )
                        .setColor(0xff0000),
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`deleteUser`)
                            .setLabel(`PURGE`)
                            .setStyle(ButtonStyle.Danger)
                    ),
                ],
            });

            const collector = reply.createMessageComponentCollector({
                componentType: ComponentType.Button,
            });

            collector.on("collect", async (buttonInteraction) => {
                if (buttonInteraction.customId == "deleteUser") {
                    this.confirmButton(buttonInteraction, user._id.toString());
                }
            });

            return;
        });
    }
    async confirmButton(interaction: ButtonInteraction, docId: string) {
        const userDoc = await User.findById(docId);

        if (!userDoc) {
            return;
        }

        if (userDoc.ID != interaction.user.id) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `**you cannot purge another users info**`
                        )
                        .setColor(0xff0000),
                ],
            });
        }

        const deletedUser = await User.findByIdAndRemove(docId, { lean: true });

        if (deletedUser) {
            interaction.update({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`**deleted user profile**`)
                        .setColor(0xff0000),
                ],
                components: [],
            });
        } else {
            interaction.update({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`**could not deleted account**`)
                        .setColor(0xff0000),
                ],
                components: [],
            });
        }
    }
}
