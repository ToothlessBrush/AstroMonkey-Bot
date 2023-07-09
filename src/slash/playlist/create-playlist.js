const { EmbedBuilder, SlashCommandBuilder } = require("discord.js")
const Server = require("./../../model/server")
const User = require("./../../model/User")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("create-playlist")
        .setDescription(
            "create a playlist which you can add songs to and play in queue"
        )
        .addStringOption((option) =>
            option
                .setName("type")
                .setDescription(
                    "create a private personal playlist or shared server playlist"
                )
                .setRequired(true)
                .addChoices(
                    { name: "Personal", value: "PERSONAL" },
                    { name: "Server", value: "SERVER" }
                )
        )
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("name of the playlist you want to create")
                .setRequired(true)
        ),

    run: async ({ client, interaction }) => {
        const serverType = interaction.options.getString("type") == "SERVER"

        const playlistData = {
            name: interaction.options.getString("name"),
            creater: {
                name: interaction.user.username,
                ID: interaction.user.id,
            },
            length: 0,
            tracks: [],
        }

        if (serverType) {
            const serverID = interaction.guild.id

            Server.findOne({ "server.ID": serverID }).then((server) => {
                if (server) {
                    console.log("found server")

                    //checks for duplicate playlists
                    const playlistExists = server.playlists.find(
                        (playlist) => playlist.name == playlistData.name
                    )

                    if (playlistExists) {
                        console.log("playlist already exists")
                        return interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xff0000)
                                    .setTitle("Playlist Already Exists!"),
                            ],
                        })
                    }
                    
                    server.playlists.push(playlistData)
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xa020f0)
                                .setTitle("Created Playlist!")
                                .setDescription(
                                    `Created the \`${playlistData.name}\` playlist for this server!`
                                ),
                        ],
                    })
                    return server.save()
                } else {
                    console.log("Server Not Found")
                    const newServer = new Server({
                        server: {
                            name: interaction.guild.name,
                            ID: interaction.guild.id,
                        },
                        playlists: [playlistData],
                    })
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xa020f0)
                                .setTitle("Created Playlist!")
                                .setDescription(
                                    `Created the \`${playlistData.name}\` playlist for this server!`
                                ),
                        ],
                    })
                    return newServer.save()
                }
            })
        } else {
            const userID = interaction.user.id

            User.findOne({ ID: userID }).then((user) => {
                if (user) {
                    console.log("found user")

                    const playlistExists = user.playlists.find(
                        (playlist) => playlist.name == playlistData.name
                    )

                    if (playlistExists) {
                        console.log("playlist already exists")
                        return interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xff0000)
                                    .setTitle("Playlist Already Exists!"),
                            ],
                        })
                    } else {
                        user.playlists.push(playlistData)
                        interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xa020f0)
                                    .setTitle("Created Playlist!")
                                    .setDescription(
                                        `Created the \`${playlistData.name}\` playlist for this server!`
                                    ),
                            ],
                        })
                        return user.save()
                    }
                } else {
                    console.log("User Not Found")
                    const newUser = new User({
                        name: interaction.user.username,
                        ID: interaction.user.id,
                        playlists: [playlistData],
                    })
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xa020f0)
                                .setTitle("Created Playlist!")
                                .setDescription(
                                    `Created the \`${playlistData.name}\` playlist!`
                                ),
                        ],
                    })
                    return newUser.save()
                }
            })
        }
    },
}
