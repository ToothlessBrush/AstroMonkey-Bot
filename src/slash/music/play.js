const { SlashCommandBuilder, ButtonBuilder } = require("@discordjs/builders")
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonStyle,
    PermissionsBitField,
} = require("discord.js")
const { QueryType, SearchResult } = require("discord-player")

const { isUrl } = require("./../../utils/isUrl")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("plays a song from youtube or spotify")
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription("a search term, share link, or URL of the song")
                .setRequired(true)
                .setAutocomplete(true)
        ),

    autocomplete: async ({ client, interaction }) => {
        const focusedValue = interaction.options.getFocused()

        //search platforms for the query
        let result_search

        let choices = []
        if (focusedValue) {
            choices.push({
                name: focusedValue.slice(0, 100),
                value: focusedValue.slice(0, 100),
            })
            if (isUrl(focusedValue)) {
                result_search = await client.player.search(focusedValue, {
                    searchEngine: QueryType.AUTO,
                })
            } else {
                result_search = await client.player.search(focusedValue, {
                    searchEngine: QueryType.YOUTUBE_SEARCH,
                })
            }
        }

        //set choices for autocomplete
        if (result_search?.playlist) {
            choices.push({
                name: result_search.playlist.title.slice(0, 100),
                value: result_search.playlist.url.slice(0, 100),
            })
        } else {
            result_search?.tracks?.forEach((track) =>
                choices.push({
                    name: track.title.slice(0, 100),
                    value: track.url.slice(0, 100),
                })
            )
        }

        return await interaction.respond(choices.slice(0, 5))
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

        //verify permission to connect
        voiceChannelPermissions =
            interaction.member.voice.channel.permissionsFor(
                interaction.guild.members.me
            )

        if (
            !voiceChannelPermissions.has(PermissionsBitField.Flags.Connect) ||
            !voiceChannelPermissions.has(PermissionsBitField.Flags.Speak)
        ) {
            console.log("no connect/speak permission")
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            "**I don't have permission to connect and speak in that voice channel**"
                        )
                        .setColor(0xff0000),
                ],
            })
        }

        queue = await client.player.nodes.create(interaction.guild, {
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

        let embed = new EmbedBuilder() //need to change this to embed builder for v14 (done)

        //grabs query string differently depending on which interaction type it is
        let query
        if (interaction.isChatInputCommand()) {
            query = interaction.options.getString("query")
        } else if (interaction.isStringSelectMenu()) {
            query = interaction.values[0]
        }

        let result_search

        let tracks
        if (isUrl(query)) {
            //auto searches the url
            console.log(`searching url: ${query}`)

            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00cbb7)
                        .setTitle("Searching...")
                        .setDescription("searching URL "),
                ],
            })

            result_search = await client.player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO,
            })

            tracks = result_search.tracks //add multiple tracks if playlist/album
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

            result_search = await client.player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_SEARCH,
            })

            tracks = [result_search.tracks[0]] //adds 1 track from search
        }

        if (tracks.length === 0) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**No Results!**`),
                ],
            })
        }

        try {
            await queue.addTrack(tracks)
        } catch (error) {
            console.error(error)
        }
        //adds track(s) from the search result

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

        if (!queue.node.isPlaying()) {
            await queue.node.play() //play if not already playing
        }

        //build embed based on info
        if (tracks.length > 1) {
            playlist = tracks[0].playlist
            //console.log(tracks)

            embed
                .setColor(0xa020f0) //purple
                .setTitle(
                    `Queued ${tracks.length} Tracks From \`${result_search.playlist?.title}\``
                )
                .setDescription(
                    `**Starting With**\n**[${tracks[0].title}](${tracks[0].url})**\nBy ${tracks[0].author}`
                )
                .setThumbnail(tracks[0].thumbnail)
                .setFooter({
                    text: `${interaction.user.username}`,
                    iconURL: interaction.user.avatarURL(),
                })
                .setTimestamp()
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
                            .setCustomId("pauseButton")
                            //.setLabel("Pause")
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji({
                                name: "Pause",
                                id: "1150516067983171755",
                            }) // Set emoji here using setEmoji
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`skipButton`)
                            //.setLabel(`Skip`)
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji({
                                name: "Next",
                                id: "1150516100824571965",
                            })
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("shuffleButton")
                            //.setLabel(`Shuffle`)
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji({
                                name: "Shuffle",
                                id: "1150515970432053249",
                            })
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`queueButton`)
                            .setLabel(`Queue`)
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji({
                                name: "Queue",
                                id: "1150521944828039269",
                            })
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`like~${tracks[0].url}`)
                            .setLabel("Like")
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji({
                                name: "Heart",
                                id: "1150523515250942025",
                            })
                    ),
            ],
        })
    },
}
