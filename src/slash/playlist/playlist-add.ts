import {
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    CommandInteraction,
} from "discord.js"

import {
    EmbedBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js"
import { QueryType, Track, useMainPlayer } from "discord-player"

import path from "path"

import { IServer, Server } from "./../../model/Server.js"
import { User } from "./../../model/User.js"

import isUrl from "./../../utils/isUrl"
import MyClient from "../../utils/MyClient.js"

export default {
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

    autocomplete: async (interaction: AutocompleteInteraction) => {
        const focusedValue = interaction.options.getFocused()
        let choices = ["Likes"]
        await Server.findOne({ "server.ID": interaction.guild?.id }).then(
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
        function removeDuplicates<T>(arr: T[]): T[] {
            return arr.filter((item, index) => arr.indexOf(item) === index)
        }

        const filtered = choices.filter((choice) =>
            choice.startsWith(focusedValue)
        )

        await interaction.respond(
            filtered.map((choice) => ({ name: choice, value: choice }))
        )
    },

    run: async (interaction: ChatInputCommandInteraction) => {
        const client = interaction.client as MyClient
        const playlistName = interaction.options.get("playlist")
            ?.value as string
        const query = interaction.options.get("query")?.value as string
        const serverID = interaction.guild?.id
        const userID = interaction.user.id

        if (playlistName == "Likes") {
            return client.slashcommands
                .get("like")
                .likeFromAdd(interaction, query)
        }

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

        if (!userPL && !serverPL) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(
                            `Could Not Find Playlist With Name: \`${playlistName}\``
                        )
                        .setDescription(
                            `Create a playlist with </create-playlist:1138955261441224825>`
                        ),
                ],
            })
        }

        let track = await searchQuery(query, interaction)

        if (!track) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle("No Results!"),
                ],
            })
        }

        if (serverPL && userPL) {
            //customId of button under 100 characters
            let customIdTrack
            if (track.url.length > 60) {
                customIdTrack = track.title
            } else {
                customIdTrack = track.url
            }

            const serverCustomId = `addServerPL~${serverPL._id?.toString()}~${customIdTrack}`
            const userCustomId = `addUserPL~${userPL._id?.toString()}~${customIdTrack}`

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
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId(serverCustomId)
                            .setLabel(`Server`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(userCustomId)
                            .setLabel(`Personal`)
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
            })
        }

        //save to db
        if (userPL && user) {
            userPL.tracks.push(track.toJSON(true))
            user.save()
        }

        if (serverPL && server) {
            serverPL.tracks.push(track.toJSON(true))
            server.save()
        }

        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0)
                    .setTitle(
                        `Added to \`${userPL ? userPL.name : serverPL?.name}\``
                    )
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
    },

    //need to switch to collector
    buttons: async (
        interaction: ButtonInteraction,
        docType: string,
        playlistID: string,
        query: string
    ) => {
        const serverID = interaction.guild?.id
        const userID = interaction.user.id

        const track = await searchQuery(query, interaction)

        if (!track) {
            return
        }

        let playlistName

        if (docType == "user") {
            User.findOne({ ID: userID }).then((user) => {
                if (!user) {
                    return interaction.editReply({
                        content: "User Data Not Found!",
                        embeds: [],
                        components: [],
                    })
                }
                //find playlist based on doc id
                let userPL = user.playlists.find(
                    (playlist) => playlist._id?.toString() == playlistID
                )

                if (!userPL) {
                    return interaction.editReply({
                        content: "Playlist Data Not Found!",
                        embeds: [],
                        components: [],
                    })
                }

                userPL.tracks.push(track.toJSON(true))
                user.save()

                return trackAddedReply(interaction, userPL.name, track)
            })
        } else if (docType == "server") {
            Server.findOne({ "server.ID": serverID }).then((server) => {
                if (!server) {
                    return interaction.editReply({
                        content: "Server Data Not Found!",
                        embeds: [],
                        components: [],
                    })
                }
                //find playlist based on doc id
                let serverPL = server.playlists.find(
                    (playlist) => playlist._id?.toString() == playlistID
                )

                if (!serverPL) {
                    return interaction.editReply({
                        content: "Playlist Data Not Found!",
                        embeds: [],
                        components: [],
                    })
                }

                serverPL.tracks.push(track.toJSON(true))
                server.save()

                return trackAddedReply(interaction, serverPL.name, track)
            })
        }

        async function trackAddedReply(
            interaction: CommandInteraction | ButtonInteraction,
            playlistName: string,
            track: Track | undefined
        ) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xa020f0)
                        .setTitle(`Added to \`${playlistName}\``)
                        .setDescription(
                            `**[${track?.title}](${track?.url})** \n*By ${track?.author}* | ${track?.duration}`
                        )
                        .setThumbnail(track?.thumbnail || null)
                        .setFooter({
                            text: `${interaction.user.username}`,
                            iconURL: interaction.user.avatarURL() || undefined,
                        })
                        .setTimestamp(),
                ],
                components: [],
            })
        }
    },
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
) {
    const buttonInteraction = interaction.isButton()

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

        if (buttonInteraction) {
            await interaction.update({
                embeds: [URLembed],
            })
        } else {
            await interaction.editReply({
                embeds: [URLembed],
            })
        }

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

        if (buttonInteraction) {
            await interaction.update({
                embeds: [YTembed],
            })
        } else {
            await interaction.editReply({
                embeds: [YTembed],
            })
        }

        result_search = await player.search(query, {
            requestedBy: interaction.user,
            searchEngine: QueryType.YOUTUBE_SEARCH,
        })
    }

    if (!result_search) {
        return
    }

    return result_search.tracks[0]
}
