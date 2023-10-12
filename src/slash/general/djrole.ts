import { SlashCommandBuilder, EmbedBuilder } from "@discordjs/builders"
import { CommandInteraction, PermissionFlagsBits } from "discord.js"

export default {
    data: new SlashCommandBuilder()
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
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    run: async (interaction: CommandInteraction ) => {
        
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
    },
}
