const { SlashCommandBuilder } = require("@discordjs/builders")
const { EmbedBuilder } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("info")
        .setDescription("displays info of the current song"),

    run: async ({ client, interaction }) => {
        const queue = client.player.nodes.get(interaction.guildId)

        if (!queue) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**No Song is Currently Playing!**`),
                ],
            })
        }

        const currentSong = queue.currentTrack

        let bar = queue.node.createProgressBar({
            queue: false,
            length: 19,
        })

        //let progressBar = `${queue.getPlayerTimestamp().current} **|**${bar}**|** ${queue.getPlayerTimestamp().end}`

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0) //purple
                    .setTitle(`Currently Playing`)
                    .setDescription(
                        currentSong
                            ? `[${currentSong.title}](${currentSong.url})\n${bar}\n**Requested by: <@${currentSong.requestedBy.id}>**`
                            : "None"
                    ),
            ],
        })
    },
}
