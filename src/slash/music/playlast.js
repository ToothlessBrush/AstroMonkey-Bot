const { SlashCommandBuilder } = require("@discordjs/builders")
const { EmbedBuilder } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("playlast")
        .setDescription("Plays the Previously Played Song"),

    run: async ({ client, interaction }) => {
        const queue = client.player.nodes.get(interaction.guildId)

        if (!queue) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`**No Music in Queue!**`),
                ],
            })
        }

        let embed = new EmbedBuilder()

        embed.setColor(0xa020f0)

        if (queue.history.previousTrack != null) {
            await queue.history.back()
            let song = queue.currentTrack
            embed
                .setTitle(`**Playing**`)
                .setDescription(`**[${song.title}](${song.url})**`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Duration: ${song.duration}` })
        } else {
            embed
                .setColor(0xff0000)
                .setDescription(`**There is no Previous Track**`)
        }

        await interaction.editReply({
            embeds: [embed],
        })
    },
}
