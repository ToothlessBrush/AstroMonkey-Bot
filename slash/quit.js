const { SlashCommandBuilder } = require("@discordjs/builders")
const { EmbedBuilder } = require("discord.js")

module.exports = {
	data: new SlashCommandBuilder()
        .setName("quit")
        .setDescription("clears queue and stops bot"),
	
    run: async ({ client, interaction }) => {
		const queue = client.player.nodes.get(interaction.guildId)

		if (!queue) return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`**No Music in Queue!**`)]})

		queue.delete();
        await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle(`**Quitting**`)]})
	},
}