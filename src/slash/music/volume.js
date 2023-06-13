const { EmbedBuilder } = require("@discordjs/builders");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("volume")
        .setDescription("change the volume of the music")
        .addNumberOption((option) => 
            option
                .setName("volume")
                .setDescription("The volume percentage you would like to set to")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
                ),

    run: async ({ client, interaction }) => {
        const queue = client.player.nodes.get(interaction.guildId)
        
        if (!queue) {
            return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`**no song is currently playing**`)]})
        }

        const volume = interaction.options.getNumber("volume")

        await queue.node.setVolume(volume)

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xA020F0)
                    .setTitle(`Volume set to \`${volume}%\``)
            ]
        })
    }
}