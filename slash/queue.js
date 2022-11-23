const { SlashCommandBuilder } = require("@discordjs/builders")
const { EmbedBuilder } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("display the current songs in queue")
    .addNumberOption((option) => option.setName("page").setDescription("page number").setMinValue(1)),

    run: async ({ client, interaction }) => {
        const queue = client.player.getQueue(interaction.guildId)
        if (!queue || !queue.playing){
            return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xA020F0).setDescription(`**No Music in Queue!**`)]})
        }

        let totalPages = Math.ceil(queue.tracks.length / 10)
        if (totalPages == 0) { //set pages to 1 when song playing but no queue
            totalPages = 1
        }
        
        const page = (interaction.options.getNumber("page") || 1) - 1

        if (page >= totalPages) {
            return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xA020F0).setTitle(`Invalid Page!`).setDescription(`there are only ${totalPages} pages`)]})
        }

        const queueString = queue.tracks.slice(page * 10, page * 10 + 10).map((song, i) => {
            return `**${page * 10 + i + 1}.** \`[${song.duration}]\` [${song.title}](${song.url})\n**Requested By: <@${song.requestedBy.id}>**`
        }).join("\n")

        const currentSong = queue.current

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setColor(0xA020F0)
                .setDescription(`**Currently Playing**\n` + 
                (currentSong ? `\`[${currentSong.duration}]\` [${currentSong.title}](${currentSong.url})\n**Requested by: <@${currentSong.requestedBy.id}>**` : "None") +
                `\n\n**Queue**\n${queueString}`
                )
                .setFooter({
                    text: `Page ${page + 1} of ${totalPages}`
                })
                .setThumbnail(currentSong.thumbnail)
            ]
        })
    }
}