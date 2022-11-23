const { SlashCommandBuilder } = require("@discordjs/builders")
const { EmbedBuilder } = require("discord.js")

module.exports = {
	data: new SlashCommandBuilder()
        .setName("resume")
        .setDescription("resumes the music queue"),
	
    run: async ({ client, interaction }) => {
		const queue = client.player.getQueue(interaction.guildId)

		if (!queue) {
            return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xA020F0).setTitle(`No songs in queue!`)]})
        }
		//calling queue.setPaused() causes queue to break
        queue.setPaused(false)
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setColor(0xA020F0) //purple
                .setTitle(`Resumed`)
                .setDescription(`use /pause to pause the queue`)
            ]
        })
        //queue.setPause()
	},
}