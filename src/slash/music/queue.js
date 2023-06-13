const { SlashCommandBuilder, ActionRowBuilder } = require("@discordjs/builders")
const { EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("display the current songs in queue")
        .addNumberOption((option) => 
            option
                .setName("page")
                .setDescription("page number")
                .setMinValue(1)
                ),

    run: async ({ client, interaction }) => {
        const queue = client.player.nodes.get(interaction.guildId)
        if (!queue || !queue.node.isPlaying()){
            return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`**No Music in Queue!**`)]})
        }

        //console.log(queue.tracks.length)
        //console.log(queue.getPlayerTimestamp().current)
        let totalPages = Math.ceil(queue.tracks.size / 10)
        if (totalPages == 0) { //set pages to 1 when song playing but no queue
            totalPages = 1
        }
        
        const page = (interaction.options.getNumber("page") || 1) - 1

        if (page >= totalPages) {
            return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle(`Invalid Page!`).setDescription(`there are only ${totalPages} pages`)]})
        }

        //console.log(queue.node)
        const queueString = queue.tracks.data.slice(page * 10, page * 10 + 10).map((song, i) => {
            return `**${page * 10 + i + 1}.** \`[${song.duration}]\` [${song.title}](${song.url})\n**Requested By: <@${song.requestedBy.id}>**`
        }).join("\n")

        const currentSong = queue.currentTrack

        let bar = queue.node.createProgressBar({
            queue: false,
            length: 19,
        })

        //let progressBar = `/*${queue.node.getTimestamp()} **|***/${bar}/***|** ${queue.node.getTimestamp()}*/`

        //let nextButton
        let prevPage
        if (page == 0) {
            prevPage = 0
        } else {
            prevPage = page - 1
        }

        let nextPage
        if ((page + 1) == totalPages) {
            nextPage = page
        } else {
            nextPage = page + 1 
        }
        
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setColor(0xA020F0)
                .setDescription(`**Currently Playing**\n` + 
                (currentSong ? `[${currentSong.title}](${currentSong.url})\n${bar}\n**Requested by: <@${currentSong.requestedBy.id}>**` : "None") +
                `\n\n**Queue**\n${queueString}`
                )
                .setFooter({
                    text: `Page ${page + 1} of ${totalPages}`
                })
                .setThumbnail(currentSong.thumbnail)
            ],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`prevPageButton_${prevPage}`)
                            .setLabel(`<`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`refreshQueue`)
                            .setLabel("↻")
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`nextPageButton_${nextPage}`)
                            .setLabel(`>`)
                            .setStyle(ButtonStyle.Secondary)                             
                    )
                    
            ]
        })
    }
}