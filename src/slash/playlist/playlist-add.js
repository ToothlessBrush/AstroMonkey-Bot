const { EmbedBuilder, SlashCommandBuilder } = require("discord.js")
const { QueryType, Track } = require("discord-player")

const Server = require("./../../model/server")
const User = require("./../../model/User")

const { isUrl } = require("./../../utils/isUrl")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("playlist-add")
        .setDescription("add tracks to a playlist")
        .addStringOption((option) =>
            option
                .setName("playlist")
                .setDescription("name of the playlist you want to add to")
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription(
                    "song you want to search for and add to playlist"
                )
                .setRequired(true)
        ),

    autocomplete: async ({ client, interaction }) => {
        const focusedValue = interaction.options.getFocused()
        let choices = []
        await Server.findOne({ "server.ID": interaction.guild.id }).then(
            (server) => {
                if (server.playlists) {
                    server.playlists
                        .map((playlist) => playlist.name)
                        .forEach((name) => {
                            choices.push(name)
                        })
                }
            }
        )
        await User.findOne({ ID: interaction.user.id }).then((user) => {
            if (user.playlists) {
                user.playlists
                    .map((playlist) => playlist.name)
                    .forEach((name) => {
                        choices.push(name)
                    })
            }
        })

        choices = removeDuplicates(choices)
        function removeDuplicates(arr) {
            return arr.filter((item, index) => arr.indexOf(item) === index)
        }

        const filtered = choices.filter((choice) =>
            choice.startsWith(focusedValue)
        )

        await interaction.respond(
            filtered.map((choice) => ({ name: choice, value: choice }))
        )
    },

    run: async ({ client, interaction }) => {
        const playlistName = interaction.options.getString("playlist")
        const query = interaction.options.getString("query")
        const serverID = interaction.guild.id
        const userID = interaction.user.id

        Server.findOne({ "server.ID": serverID }).then(async (server) => {
            if (server) {
                const playlist = server.playlists.find(
                    (playlist) => playlist.name == playlistName
                )

                if (!playlist) {
                    return interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xff0000)
                                .setTitle("Playlist Not Found!"),
                        ],
                    })
                }

                track = await searchQuery(query)
                console.log(track)
                playlist.tracks.push(track)

                return server.save()
            }

            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle("Playlist Not Found!"),
                ],
            })
        })

        //return track object
        async function searchQuery(query) {
            if (isUrl(query)) {
                console.log(`searching url: ${query}`)

                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x00cbb7)
                            .setTitle("Searching...")
                            .setDescription("searching URL "),
                    ],
                })

                const result_search = await client.player.search(query, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.AUTO,
                })

                //remove circular and unneeded properties
                delete result_search.tracks[0].playlist
                delete result_search.tracks[0].extractors
                delete result_search.tracks[0].client
                delete result_search.tracks[0].player
                delete result_search.tracks[0].voiceUtils

                return result_search.tracks[0]
            } else {
                //searches youtube if its not a url
                console.log(`searching prompt: ${query}`)

                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x00cbb7)
                            .setTitle("Searching...")
                            .setDescription(`searching youtube for ${query}`),
                    ],
                })

                const result_search = await client.player.search(query, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.YOUTUBE_SEARCH,
                })

                //remove circular and unneeded properties
                delete result_search.tracks[0].playlist
                delete result_search.tracks[0].extractors
                delete result_search.tracks[0].extractor
                delete result_search.tracks[0].client
                delete result_search.tracks[0].player
                delete result_search.tracks[0].voiceUtils

                return result_search.tracks[0] //adds 1 track from search
            }
        }
    },
}
