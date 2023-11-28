import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    CommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js"

import { QueryType, Track, TrackJSON, useMainPlayer } from "discord-player"
import isUrl from "./../../utils/isUrl"
import { User } from "./../../model/User.js"
import { Query } from "mongoose"
export default class Like {
    constructor() {}

    data = new SlashCommandBuilder()
        .setName("like")
        .setDescription("Like a song (same as playlist-add Likes")
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription("Song you want to like")
                .setRequired(true)
        )

    async run(interaction: ChatInputCommandInteraction) {
        const track = await searchQuery(
            interaction.options.get("query")?.value as string,
            interaction
        )

        // if (!query) {
        //     return
        // }

        return addLikedTrack(interaction, track?.toJSON(true))
    }

    async button(interaction: ButtonInteraction, track: TrackJSON) {
        await interaction.deferReply()
        return addLikedTrack(interaction, track)
    }
}

async function addLikedTrack(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    track: TrackJSON | undefined
) {
    // const track = await searchQuery(query, interaction)

    if (!track) {
        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("No Results!")

        return interaction.editReply({ embeds: [embed] })
    }

    User.findOne({ ID: interaction.user.id }).then(async (user) => {
        if (user) {
            user.likes.push(track)
            user.save()
        } else {
            console.log("Creating new user")
            const newUser = new User({
                name: interaction.user.username,
                ID: interaction.user.id,
                likes: [track],
                playlists: [],
            })
            newUser.save()
        }

        const embed = new EmbedBuilder()
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
            .setTimestamp()

        return interaction.editReply({
            embeds: [embed],
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
