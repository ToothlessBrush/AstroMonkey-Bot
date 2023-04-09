const { SlashCommandBuilder, ActionRowBuilder } = require("@discordjs/builders")
const { EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

module.exports = {
	data: new SlashCommandBuilder()
        .setName("pause")
        .setDescription("pauses the music queue"),
	
    run: async ({ client, interaction }) => {
		const queue = client.player.nodes.get(interaction.guildId)
        
        if (!queue) {
            return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xA020F0).setDescription(`**No Music in Queue!**`)]})
        }
		//calling queue.setPaused() causes queue to break
        
        //queue.playing
        
        queue.node.pause()
        
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setColor(0xA020F0) //purple
                .setTitle(`Paused`)
                .setDescription(`Click Resume or use /resume to resume the queue`)
            ],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`resumeButton`)
                            .setLabel(`Resume`)
                            .setStyle(ButtonStyle.Primary)
                    )
            ]
        })     //("Paused! Use /resume to resume")
        //queue.setPause()
	},
}