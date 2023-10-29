import { SlashCommandBuilder, EmbedBuilder } from "@discordjs/builders"
import {
    ChatInputCommandInteraction,
    CommandInteraction,
    PermissionFlagsBits,
} from "discord.js"

export default class djrole {
    constructor() {}
    data = new SlashCommandBuilder()
        .setName("djrole")
        .setDescription(
            "set the djrole which restricts certain features of music commands to that role"
        )
        .addRoleOption((option) =>
            option
                .setName("role")
                .setDescription("the role to set the djrole")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    async run(interaction: ChatInputCommandInteraction) {
        if (interaction.isAutocomplete()) {
            return
        }

        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setDescription(`djrole is currently WIP`),
            ],
        })
    }
}
