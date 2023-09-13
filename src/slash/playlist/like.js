const { EmbedBuilder, SlashCommandBuilder } = require("discord.js")

const { QueryType } = require("discord-player")
const { isUrl } = require("./../../utils/isUrl")
const path = require("path")
const User = require(path.join(__dirname, "./../../model/User.js"))
module.exports = {
    data: new SlashCommandBuilder()
        .setName("like")
        .setDescription("Like a song (same as playlist-add Likes")
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription("Song you want to like")
                .setRequired(true)
        ),

    run: async ({ client, interaction }) => {
        let query
        if (interaction.isChatInputCommand()) {
            query = interaction.options.getString("query")
        } else if (interaction.isButton()) {
            query = interaction.customId.split("~")[1]
        }

        return addLikedTrack(interaction, query)
    },

    likeFromAdd: (interaction, query) => {
        return addLikedTrack(interaction, query)
    },
}

async function addLikedTrack(interaction, query) {
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
                        iconURL: interaction.user.avatarURL(),
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
async function searchQuery(query, interaction) {
    const buttonInteraction = interaction.isButton()

    const client = interaction.client
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

        result_search = await client.player.search(query, {
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

        result_search = await client.player.search(query, {
            requestedBy: interaction.user,
            searchEngine: QueryType.YOUTUBE_SEARCH,
        })
    }

    if (!result_search) {
        return
    }

    //stupid way of doing it
    //remove circular and unneeded properties 
    // delete result_search.tracks[0].playlist
    // delete result_search.tracks[0].extractors
    // delete result_search.tracks[0].extractor
    // delete result_search.tracks[0].client
    // delete result_search.tracks[0].player
    // delete result_search.tracks[0].voiceUtils

    return result_search.tracks[0] //adds 1 track from search
}
