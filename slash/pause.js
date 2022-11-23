const { SlashCommandBuilder } = require("@discordjs/builders")
const { EmbedBuilder } = require("discord.js")

module.exports = {
	data: new SlashCommandBuilder()
        .setName("pause")
        .setDescription("pauses the music queue"),
	
    run: async ({ client, interaction }) => {
		const queue = client.player.getQueue(interaction.guildId)
        
        if (!queue) {
            return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xA020F0).setDescription(`**No Music in Queue!**`)]})
        }
		//calling queue.setPaused() causes queue to break
        queue.setPaused(true)
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setColor(0xA020F0) //purple
                .setTitle(`Paused`)
                .setDescription(`use /resume to resume the queue`)
            ]
        })     //("Paused! Use /resume to resume")
        //queue.setPause()
	},
}