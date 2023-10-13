import {
    ActionRow,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    Embed,
    SlashCommandBuilder,
} from "discord.js"
import { User } from "./../../model/User"
import {
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
} from "@discordjs/builders"

export default {
    data: new SlashCommandBuilder()
        .setName("purge-info")
        .setDescription("Remove all your discord info from the database"),
    run: async (interaction: ChatInputCommandInteraction) => {
        User.findOne({ ID: interaction.user.id }).then((user) => {
            if (!user) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`**No info found**`)
                            .setColor(0xff0000),
                    ],
                })
            }

            interaction.editReply({
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
                            .setCustomId(`deleteUser~${user?._id.toString()}`)
                            .setLabel(`PURGE`)
                            .setStyle(ButtonStyle.Danger)
                    ),
                ],
            })
        })
    },
    buttons: async (interaction: ButtonInteraction, docId: string) => {
        const userDoc = await User.findById(docId)

        if (!userDoc) {
            return
        }

        if (userDoc.ID != interaction.user.id) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `**you cannot purge another users info**`
                        )
                        .setColor(0xff0000),
                ],
            })
        }

        const deletedUser = await User.findByIdAndRemove(docId)

        if (deletedUser) {
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`**deleted user profile**`)
                        .setColor(0xff0000),
                ],
            })
        } else {
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`**could not deleted account**`)
                        .setColor(0xff0000),
                ],
            })
        }
    },
}
