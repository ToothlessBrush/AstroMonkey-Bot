const { SlashCommandBuilder, ActionRowBuilder } = require("@discordjs/builders")
const { EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

module.exports = {
	data: new SlashCommandBuilder()
        .setName("resume")
        .setDescription("resumes the music queue"),
	
    run: async ({ client, interaction }) => {
		const queue = client.player.nodes.get(interaction.guildId)

		if (!queue) {
            return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`**No Music in Queue!**`)]})
        }
		//calling queue.setPaused() causes queue to break
        queue.node.resume();
        
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setColor(0xA020F0) //purple
                .setTitle(`Resumed`)
                .setDescription(`Press Pause or use /pause to pause the queue`)
            ],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`pauseButton`)
                            .setLabel(`Pause`)
                            .setStyle(ButtonStyle.Primary)
                    )
            ]
        })

        //queue.setPause()
	},
}