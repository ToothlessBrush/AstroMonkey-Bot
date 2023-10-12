import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    CommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js"

import { QueryType, Track, useMainPlayer } from "discord-player"
import isUrl from "./../../utils/isUrl"
import path from "path"
import { User } from "./../../model/User.js"
export default {
    data: new SlashCommandBuilder()
        .setName("like")
        .setDescription("Like a song (same as playlist-add Likes")
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription("Song you want to like")
                .setRequired(true)
        ),

    run: async (
        interaction: ChatInputCommandInteraction | ButtonInteraction
    ) => {
        let query

        const isButton = interaction.isButton()

        if (!isButton) {
            query = interaction.options.get("query")?.value as string
        } else if (isButton) {
            query = (interaction as ButtonInteraction).customId.split("~")[1]
        }

        if (!query) {
            return
        }

        return addLikedTrack(interaction, query)
    },
}

async function addLikedTrack(
    interaction: CommandInteraction | ButtonInteraction,
    query: string
) {
    const track = await searchQuery(query, interaction)

    if (!track) {
        return interaction.editReply({
            embeds: [
                new EmbedBuilder().setColor(0xff0000).setTitle("No Results!"),
            ],
        })
    }

    User.findOne({ ID: interaction.user.id }).then(async (user) => {
        if (user) {
            user.likes.push(track.toJSON(true))
            user.save()
        } else {
            console.log("Creating new user")
            const newUser = new User({
                name: interaction.user.username,
                ID: interaction.user.id,
                likes: [track.toJSON(true)],
                playlists: [],
            })
            newUser.save()
        }

        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0)
                    // .setAuthor({
                    //     name: interaction.user.username,
                    //     iconURL: interaction.user.avatarURL(),
                    // })
                    .setTitle(`Added to Likes Playlist`)
                    .setDescription(
                        `**[${track.title}](${track.url})** \n*By ${track.author}* | ${track.duration}`
                    )
                    .setThumbnail(track.thumbnail)
                    .setFooter({
                        text: `${interaction.user.username}`,
                        iconURL: interaction.user.avatarURL() || undefined,
                    })
                    .setTimestamp(),
            ],
        })
    })
}

/** search youtube, spotify, or soundcloud for a track and returns it as an object
 *
 * Note: updates button interaction
 *
 * @param {String} query query to search for
 * @param {object} interaction discord interaction object
 * @returns {object} track object to add to db
 */
async function searchQuery(
    query: string,
    interaction: CommandInteraction | ButtonInteraction
): Promise<Track<unknown> | undefined> {
    const player = useMainPlayer()

    if (!player) {
        return
    }

    let result_search
    if (isUrl(query)) {
        console.log(`searching url: ${query}`)

        const URLembed = new EmbedBuilder()
            .setColor(0x00cbb7)
            .setTitle("Searching...")
            .setDescription("searching URL ")

        await interaction.editReply({
            embeds: [URLembed],
        })

        result_search = await player.search(query, {
            requestedBy: interaction.user,
            searchEngine: QueryType.AUTO,
        })
    } else {
        //searches youtube if its not a url
        console.log(`searching prompt: ${query}`)

        const YTembed = new EmbedBuilder()
            .setColor(0x00cbb7)
            .setTitle("Searching...")
            .setDescription(`searching youtube for ${query}`)

        await interaction.editReply({
            embeds: [YTembed],
        })

        result_search = await player.search(query, {
            requestedBy: interaction.user,
            searchEngine: QueryType.YOUTUBE_SEARCH,
        })
    }

    if (!result_search) {
        return
    }

    return result_search.tracks[0] //adds 1 track from search
}
