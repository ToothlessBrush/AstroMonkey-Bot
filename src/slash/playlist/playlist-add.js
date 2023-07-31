const {
    EmbedBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js")
const { QueryType } = require("discord-player")

const Server = require("./../../model/server")
const User = require("./../../model/User")

const { isUrl } = require("./../../utils/isUrl")
const playlistSchema = require("../../model/Playlist")

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
                if (!server) {
                    return
                }
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
            if (!user) {
                return
            }
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

        const server = await Server.findOne({ "server.ID": serverID })

        let serverPL
        if (server) {
            serverPL = server.playlists.find(
                (playlist) => playlist.name == playlistName
            )
        }

        const user = await User.findOne({ ID: userID })

        let userPL
        if (user) {
            userPL = user.playlists.find(
                (playlist) => playlist.name == playlistName
            )
        }

        if (serverPL && userPL) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00cbb7)
                        .setTitle("Found 2 Playlists!")
                        .setDescription(
                            `There are 2 playlists named \`${serverPL.name}\`!\n\nWould you like to add the track to the server playlist or your personal playlist?`
                        ),
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`addServerPL_${playlistName}_${query}`)
                            .setLabel(`Server`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`addUserPL_${playlistName}_${query}`)
                            .setLabel(`Personal`)
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
            })
        }

        //search for song and get track object
        let track = await searchQuery(query, interaction, false)

        //save to db
        if (userPL) {
            userPL.tracks.push(track)
            user.save()
        }

        if (serverPL) {
            serverPL.tracks.push(track)
            server.save()
        }

        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0)
                    .setTitle(
                        `Added to \`${userPL ? userPL.name : serverPL.name}\``
                    )
                    .setDescription(
                        `**[${track.title}](${track.url})** \nBy ${track.author}`
                    )
                    .setThumbnail(track.thumbnail),
            ],
        })
    },

    buttons: async (interaction, docType, playlist, query) => {
        const playlistName = playlist
        const serverID = interaction.guild.id
        const userID = interaction.user.id

        const track = await searchQuery(query, interaction, true)

        if (docType == "user") {
            User.findOne({ ID: userID }).then((user) => {
                let userPL = user.playlists.find(
                    (playlist) => playlist.name == playlistName
                )
                userPL.tracks.push(track)
                user.save()
            })
        } else if (docType == "server") {
            Server.findOne({ "server.ID": serverID }).then((server) => {
                let serverPL = server.playlists.find(
                    (playlist) => playlist.name == playlistName
                )
                serverPL.tracks.push(track)
                server.save()
            })
        }

        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0)
                    .setTitle(`Added to \`${playlist}\``)
                    .setDescription(
                        `**[${track.title}](${track.url})** \nBy ${track.author}`
                    )
                    .setThumbnail(track.thumbnail),
            ],
            components: [],
        })
    },
}

//return track object
async function searchQuery(query, interaction, update) {
    const client = interaction.client
    if (isUrl(query)) {
        console.log(`searching url: ${query}`)

        const URLembed = new EmbedBuilder()
            .setColor(0x00cbb7)
            .setTitle("Searching...")
            .setDescription("searching URL ")

        if (update) {
            await interaction.update({
                embeds: [URLembed],
            })
        } else {
            await interaction.editReply({
                embeds: [URLembed],
            })
        }

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

        const YTembed = new EmbedBuilder()
            .setColor(0x00cbb7)
            .setTitle("Searching...")
            .setDescription(`searching youtube for ${query}`)

        if (update) {
            await interaction.update({
                embeds: [YTembed],
            })
        } else {
            await interaction.editReply({
                embeds: [YTembed],
            })
        }

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
