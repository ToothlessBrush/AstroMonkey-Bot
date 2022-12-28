const { SlashCommandBuilder } = require("@discordjs/builders")
const { EmbedBuilder } = require("discord.js")

module.exports = {
	data: new SlashCommandBuilder()
        .setName("playlast")
        .setDescription("Plays the Previously Played Song"),
	
    run: async ({ client, interaction }) => {
		const queue = client.player.getQueue(interaction.guildId)
        
        if (!queue) {
            return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xA020F0).setDescription(`**no song is currently playing**`)]})
        }

        let embed = new EmbedBuilder()

        embed.setColor(0xA020F0)
        
        if  (queue.previousTracks.length > 1) {
            await queue.back()
            let song = queue.current
            embed
                .setTitle(`**Playing**`)
                .setDescription(`**[${song.title}](${song.url})**`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Duration: ${song.duration}`})
        }
        else {
            embed.setTitle(`There is no previous track`)
        }
        
        await interaction.editReply({
            embeds: [embed]
        })
	},
}