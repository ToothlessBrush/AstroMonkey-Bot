const { SlashCommandBuilder } = require("@discordjs/builders")
const { EmbedBuilder } = require("discord.js")

module.exports = {
	data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("skips the current song"),
	
    run: async ({ client, interaction }) => {
		const queue = client.player.getQueue(interaction.guildId)

		if (!queue) return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xA020F0).setDescription(`**No Music in Queue!**`)]})

        queue.skip()

        await interaction.editReply({embeds: [
            new EmbedBuilder()
            .setColor(0xA020F0)
            .setDescription(`**Skipped** [${queue.current}](${queue.current.url})`)
        ]})
	},
}