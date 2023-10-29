import { Track, useMainPlayer } from "discord-player"
import {
    ChatInputCommandInteraction,
    CommandInteraction,
    GuildMember,
} from "discord.js"

import {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    SlashCommandBuilder,
} from "discord.js"
import { QueryType } from "discord-player"

import isUrl from "./../../utils/isUrl"

export default class SearchResults {
    constructor() {}

    data = new SlashCommandBuilder()
        .setName("searchresults")
        .setDescription(
            "get the search results for a prompts and choose which out of them to play"
        )
        .addStringOption((option) =>
            option
                .setName("platform")
                .setDescription("the platform to search")
                .setRequired(true)
                .addChoices(
                    { name: "Youtube", value: "YOUTUBE" },
                    { name: "Spotify", value: "SPOTIFY" },
                    { name: "SoundCloud", value: "SOUNDCLOUD" }
                )
        )
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription("search term (use /play for url)")
                .setRequired(true)
        )

    async run(interaction: ChatInputCommandInteraction) {
        if (!(interaction.member instanceof GuildMember)) {
            return
        }

        if (!interaction.member?.voice?.channel)
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**You Must be in a VC!**`),
                ],
            })

        const player = useMainPlayer()

        if (!player) {
            return
        }

        //plays a search term or url if not in playlist
        let query = interaction.options.get("query")?.value as string
        let platform = interaction.options.get("platform")?.value as string

        if (isUrl(query))
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(
                            `**query cant be url! use /play to use url.**`
                        ),
                ],
            })

        let track: Track[] = []
        if (platform == "YOUTUBE") {
            //auto searches the url
            console.log(`searching Youtube results for: ${query}`)

            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00cbb7)
                        .setTitle("Searching...")
                        .setDescription("Searching Youtube"),
                ],
            })

            const result_search = await player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_SEARCH,
            })

            track = result_search.tracks //add multiple tracks if playlist/album
        } else if (platform == "SPOTIFY") {
            //searches youtube if its not a url
            console.log(`searching Spotify results for: ${query}`)

            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00cbb7)
                        .setTitle("Searching...")
                        .setDescription(`searching Spotify`),
                ],
            })

            const result_search = await player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.SPOTIFY_SEARCH,
            })

            track = result_search.tracks //adds 1 track from search
        } else if (platform == "SOUNDCLOUD") {
            console.log(`searching SoundCloud results for: ${query}`)

            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00cbb7)
                        .setTitle("Searching...")
                        .setDescription(`searching SoundCloud`),
                ],
            })

            const result_search = await player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.SOUNDCLOUD_SEARCH,
            })

            track = result_search.tracks
        }

        if (track.length === 0) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**No Results!**`),
                ],
            })
        }

        //console.log(tracks)

        const resultString = track
            .slice(0, 10)
            .map((song: Track, i) => {
                return `**${i + 1}.** \`[${song.duration}]\` [${song.title}](${
                    song.url
                })`
            })
            .join("\n")

        //build embed
        const resultembed = new EmbedBuilder()
            .setColor(0xa020f0)
            .setTitle("**Results**")
            .setDescription(resultString)
            .setFooter({ text: "use the menu below to select track to add" })

        //build options based on results
        let options = []
        for (let i = 0; i < Math.min(track.length, 10); i++) {
            const option = new StringSelectMenuOptionBuilder()
                .setLabel(`${track[i].title}`)
                .setValue(`${track[i].url}`) //url of song is value
                .setDescription(`By ${track[i].author}`)

            options.push(option)
        }

        const songOptions = new StringSelectMenuBuilder()
            .setCustomId("select")
            .setPlaceholder("Select Track")
            .addOptions(options)

        const row =
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                songOptions
            )

        await interaction.editReply({
            embeds: [resultembed],
            components: [row],
        })
    }
}
