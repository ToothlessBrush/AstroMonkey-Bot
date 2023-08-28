const { SlashCommandBuilder, EmbedBuilder } = require("@discordjs/builders")
const { PermissionFlagsBits } = require("discord.js")

module.exports = {
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
    run: async ({ client, interaction }) => {
        const role = interaction.options.getRole("role")
        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setDescription(`djrole is currently WIP`),
            ],
        })
    },
}
