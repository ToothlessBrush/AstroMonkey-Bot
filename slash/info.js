const { SlashCommandBuilder } = require("@discordjs/builders")
const { EmbedBuilder } = require("discord.js")

module.exports = {
	data: new SlashCommandBuilder()
        .setName("info")
        .setDescription("displays info of the current song"),
	
    run: async ({ client, interaction }) => {
		const queue = client.player.getQueue(interaction.guildId)
        
        if (!queue) {
            return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xA020F0).setDescription(`**no song is currently playing**`)]})
        }
        
        const currentSong = queue.current
        
        let bar = queue.createProgressBar({
            queue: false,
            length: 19,
        })

        let progressBar = `${queue.getPlayerTimestamp().current} **|**${bar}**|** ${queue.getPlayerTimestamp().end}`

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setColor(0xA020F0) //purple
                .setTitle(`Currently Playing`)
                .setDescription(currentSong ? `[${currentSong.title}](${currentSong.url})\n${progressBar}\n**Requested by: <@${currentSong.requestedBy.id}>**` : "None")
            ]
        })
	},
}