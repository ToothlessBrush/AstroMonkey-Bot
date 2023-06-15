const { ButtonBuilder } = require("@discordjs/builders")
const { EmbedBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js")

//probably bad coding but couldn't figure out how to get queue button to work
//displays the queue from a button input instead of a command
//very simular to the slash/queue.js with a few changes to make it work with buttons
async function queueButton(client, interaction, pageNumber, updateMessage) {
    const queue = client.player.nodes.get(interaction.guildId)

    if (!queue || !queue.node.isPlaying()) {
        const musicEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription(`**No Music in Queue!**`)
        if (updateMessage) {
            return await interaction.update({ embeds: [musicEmbed] })
        } else {
            return await interaction.editReply({ embeds: [musicEmbed] })
        }
    }

    let totalPages = Math.ceil(queue.tracks.size / 10)
    if (totalPages == 0) {
        //set pages to 1 when song playing but no queue
        totalPages = 1
    }

    const page = pageNumber

    if (page >= totalPages) {
        const pageEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(`Invalid Page!`)
            .setDescription(`there are only ${totalPages} pages`)
        if (updateMessage) {
            return await interaction.update({ embeds: [pageEmbed] })
        } else {
            return await interaction.editReply({ embeds: [pageEmbed] })
        }
    }

    const queueString = queue.tracks.data
        .slice(page * 10, page * 10 + 10)
        .map((song, i) => {
            return `**${page * 10 + i + 1}.** \`[${song.duration}]\` [${
                song.title
            }](${song.url})\n**Requested By: <@${song.requestedBy.id}>**`
        })
        .join("\n")

    const currentSong = queue.currentTrack

    let bar = queue.node.createProgressBar({
        queue: false,
        length: 19,
    })

    //let progressBar = `${queue.getPlayerTimestamp().current} **|**${bar}**|** ${queue.getPlayerTimestamp().end}`

    let prevPage
    if (page == 0) {
        prevPage = 0
    } else {
        prevPage = page - 1
    }

    let nextPage
    if (page + 1 == totalPages) {
        nextPage = page
    } else {
        nextPage = page + 1
    }

    const embed = new EmbedBuilder()
        .setColor(0xa020f0)
        .setDescription(
            `**Currently Playing**\n` +
                (currentSong
                    ? `[${currentSong.title}](${currentSong.url})\n${bar}\n**Requested by: <@${currentSong.requestedBy.id}>**`
                    : "None") +
                `\n\n**Queue**\n${queueString}`
        )
        .setFooter({
            text: `Page ${page + 1} of ${totalPages}`,
        })
        .setThumbnail(currentSong.thumbnail)

    let component = new ActionRowBuilder().addComponents(
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

    if (updateMessage) {
        await interaction.update({
            embeds: [embed],
            components: [component],
        })
    } else {
        await interaction.editReply({
            embeds: [embed],
            components: [component],
        })
    }
}

module.exports = { queueButton }
