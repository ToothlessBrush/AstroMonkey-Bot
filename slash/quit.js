const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
	data: new SlashCommandBuilder()
        .setName("quit")
        .setDescription("clears queue and stops bot"),
	
    run: async ({ client, interaction }) => {
		const queue = client.player.getQueue(interaction.guildId)

		if (!queue) return await interaction.editReply("There are no songs in queue")

        queue.setPaused(true)
        console.log(queue.setPaused())

		queue.destroy()
        await interaction.editReply("Quitting")
	},
}