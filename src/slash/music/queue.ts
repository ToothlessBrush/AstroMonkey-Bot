import { ButtonInteraction, CommandInteraction } from "discord.js"

import { SlashCommandBuilder, ActionRowBuilder } from "@discordjs/builders"
import { EmbedBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

import { useQueue } from "discord-player"

export default {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("display the current songs in queue")
        .addNumberOption((option) =>
            option.setName("page").setDescription("page number").setMinValue(1)
        ),

    run: async (interaction: CommandInteraction) => {
        const page =
            ((interaction.options.get("page")?.value as number) || 1) - 1

        return await displayQueue(interaction, page, false)
    },

    button: async (
        interaction: ButtonInteraction,
        pageNumber: number,
        updateMessage: boolean
    ) => {
        return await displayQueue(interaction, pageNumber, updateMessage)
    },
}

/**
 *
 * @param {object} client client object
 * @param {object} interaction interaction object
 * @param {int} pageNumber page number
 * @param {bool} updateMessage whether to update message or create new message
 * @returns void
 */
async function displayQueue(
    interaction: CommandInteraction | ButtonInteraction,
    page: number,
    updateMessage: boolean
) {
    if (!interaction.guild) {
        return
    }

    const queue = useQueue(interaction.guild)

    const button = interaction.isButton()

    if (!queue || !queue.node.isPlaying()) {
        const musicEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription(`**No Music in Queue!**`)
        if (updateMessage) {
            if (!button) {
                return
            }
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

    page = totalPages - 1

    const queueString = queue.tracks.data
        .slice(page * 10, page * 10 + 10)
        .map((song, i) => {
            return `**${page * 10 + i + 1}.** \`[${song.duration}]\` [${
                song.title
            }](${song.url})\n**Requested By: <@${
                song.requestedBy?.id ?? song.requestedBy
            }>**`
        })
        .join("\n")

    const currentSong = queue.currentTrack

    let bar = queue.node.createProgressBar({
        queue: false,
        length: 12,
        indicator: "<:Purple_Dot_small:1151261471142060073>",
        leftChar: "<:Purple_Bar_small:1151261449105186857>",
        rightChar: "<:White_Bar_small:1151261505912840382>",
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
                    ? `[${currentSong.title}](${
                          currentSong.url
                      })\n${bar}\n**Requested by: <@${
                          currentSong.requestedBy?.id ?? currentSong.requestedBy //different for added via trackJSON
                      }>**`
                    : "None") +
                (queue.tracks.data.length > 0
                    ? `\n\n**Queue**\n${queueString}`
                    : `\n\n**Queue Is Empty!**`)
        )
        .setFooter({
            text: `Page ${page + 1} of ${totalPages}`,
        })
        .setThumbnail(currentSong?.thumbnail || null)

    let components = new ActionRowBuilder<ButtonBuilder>()
    if (page != 0) {
        components.addComponents(
            new ButtonBuilder()
                .setCustomId(`prevPageButton~${prevPage}`)
                .setLabel(`<`)
                .setStyle(ButtonStyle.Secondary)
        )
    }

    components.addComponents(
        new ButtonBuilder()
            .setCustomId(`refreshQueue`)
            .setLabel("↻")
            .setStyle(ButtonStyle.Secondary)
    )

    if (page != totalPages - 1)
        components.addComponents(
            new ButtonBuilder()
                .setCustomId(`nextPageButton~${nextPage}`)
                .setLabel(`>`)
                .setStyle(ButtonStyle.Secondary)
        )

    if (updateMessage) {
        if (!button) {
            return
        }
        return await interaction.update({
            embeds: [embed],
            components: [components],
        })
    } else {
        return await interaction.editReply({
            embeds: [embed],
            components: [components],
        })
    }
}
