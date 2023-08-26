const { SlashCommandBuilder, ButtonBuilder } = require("@discordjs/builders")
const { EmbedBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js")
const { QueryType, Playlist } = require("discord-player")

const { blackList } = require("../../utils/blacklist")
const { isUrl } = require("../../utils/isUrl")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("soundcloudsearch")
        .setDescription(
            "searches SoundCloud with a prompt and adds first result to queue"
        )
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription(
                    "search term for SoundCloud (use /play for url)"
                )
                .setRequired(true)
                .setAutocomplete(true)
        ),

    autocomplete: async ({ client, interaction }) => {
        const focusedValue = interaction.options.getFocused()

        let result_search

        let choices = []

        if (focusedValue) {
            choices.push({ name: focusedValue, value: focusedValue })
            result_search = await client.player.search(focusedValue, {
                searchEngine: QueryType.SOUNDCLOUD_SEARCH,
            })
        }

        if (result_search?.playlist) {
            choices.push({
                name: result_search.playlist.title,
                value: result_search.playlist.title,
            })
        } else {
            result_search?.tracks?.forEach((track) => {
                choices.push({
                    name: track.title.slice(0, 100),
                    value: track.title.slice(0, 100),
                })
            })
        }

        return await interaction.respond(choices.slice(0, 6))
    },

    run: async ({ client, interaction }) => {
        if (!interaction.member.voice.channel)
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**You Must be in a VC!**`),
                ],
            })

        const queue = await client.player.nodes.create(interaction.guild, {
            metadata: {
                channel: interaction.channel,
                client: interaction.guild.members.me,
                requestedBy: interaction.user,
            },
            selfDeaf: true,
            volume: 80,
            leaveOnEmpty: true,
            leaveOnEnd: true,
            skipOnNoStream: true,
        })

        //plays a search term or url if not in playlist
        let query = interaction.options.getString("query")

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

        let tracks = []
        console.log(`searching SoundCloud: ${query}`)

        interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x00cbb7)
                    .setTitle("Searching...")
                    .setDescription(`searching SoundCloud for ${query}`),
            ],
        })

        const result_search = await client.player.search(query, {
            requestedBy: interaction.user,
            searchEngine: QueryType.SOUNDCLOUD_SEARCH,
        })

        tracks.push(result_search.tracks[0]) //adds first result

        if (!tracks[0]) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(`**No Results!**`)
                        .setDescription(`Try using /play if searching a url`),
                ],
            })
        }

        // if (!tracks[0]) {
        //     console.log(
        //         `cannot start playing as all songs are removed or dont exist`
        //     )
        //     interaction.editReply({
        //         embeds: [
        //             new EmbedBuilder()
        //                 .setColor(0xff0000)
        //                 .setTitle(
        //                     `Could not start playing as all tracks were removed or don't exist`
        //                 ),
        //         ],
        //     })
        //     return
        // }

        await queue.addTrack(tracks) //adds track(s) from the search result

        queue.interaction = interaction

        try {
            //verify vc connection
            if (!queue.connection) {
                await queue.connect(interaction.member.voice.channel)
            }
        } catch (error) {
            queue.delete()
            console.log(error)
            return await interaction.editReply({
                content: "could not join voice channel",
            })
        }

        if (!queue.node.isPlaying()) await queue.node.play() //play if not already playing

        //console.log(tracks)

        let embed = new EmbedBuilder()

        //build embed based on info
        if (tracks.length > 1) {
            playlist = tracks[0].playlist
            //console.log(tracks)

            embed
                .setColor(0xa020f0) //purple
                .setTitle(`Queued ${tracks.length} Tracks`)
                //.setDescription(`**[${playlist.title}](${playlist.url})**`) //doesnt work for spotify
                .setThumbnail(tracks[0].thumbnail)
                .setFooter({ text: `source: ${tracks[0].source}` })
        } else {
            if (queue.tracks.size == 0) {
                embed
                    .setColor(0xa020f0) //purple
                    .setTitle(`**Playing**`)
                    .setDescription(
                        `**[${tracks[0].title}](${tracks[0].url})**\n*By ${tracks[0].author}* | ${tracks[0].duration}`
                    )
                    .setThumbnail(tracks[0].thumbnail)
                    .setFooter({
                        text: `${interaction.user.username}`,
                        iconURL: interaction.user.avatarURL(),
                    })
                    .setTimestamp()
            } else {
                embed
                    .setColor(0xa020f0) //purple
                    .setTitle(`**Queued in Position ${queue.tracks.size}**`)
                    .setDescription(
                        `**[${tracks[0].title}](${tracks[0].url})**\n*By ${tracks[0].author}* | ${tracks[0].duration}`
                    )
                    .setThumbnail(tracks[0].thumbnail)
                    .setFooter({
                        text: `${interaction.user.username}`,
                        iconURL: interaction.user.avatarURL(),
                    })
                    .setTimestamp()
            }
        }

        //console.log(queue.tracks.length)

        await interaction.editReply({
            embeds: [embed],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`pauseButton`)
                            .setLabel(`Pause`)
                            .setStyle(ButtonStyle.Secondary)
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`skipButton`)
                            .setLabel(`Skip`)
                            .setStyle(ButtonStyle.Secondary)
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`queueButton`)
                            .setLabel(`Queue`)
                            .setStyle(ButtonStyle.Secondary)
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`like~${tracks[0].url}`)
                            .setLabel("Like")
                            .setStyle(ButtonStyle.Primary)
                    ),
            ],
        })
    },
}
