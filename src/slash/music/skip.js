const { SlashCommandBuilder } = require("@discordjs/builders")
const { EmbedBuilder } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("skips the current song"),

    run: async ({ interaction }) => {
        const client = interaction.client
        const queue = client.player.nodes.get(interaction.guildId)

        if (!queue)
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**No Music in Queue!**`),
                ],
            })

        const currentSong = queue.currentTrack

        queue.node.skip()

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0)
                    .setDescription(
                        `**Skipped** [${currentSong.title}](${currentSong.url})`
                    )
                    .setFooter({
                        text: `${interaction.user.username}`,
                        iconURL: interaction.user.avatarURL(),
                    })
                    .setTimestamp(),
            ],
        })
    },
}
