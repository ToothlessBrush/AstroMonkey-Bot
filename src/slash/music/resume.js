const { SlashCommandBuilder, ActionRowBuilder } = require("@discordjs/builders")
const { EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("resume")
        .setDescription("resumes the music queue"),

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
        //calling queue.setPaused() causes queue to break
        queue.node.resume()

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0) //purple
                    .setTitle(`Resumed`)
                    .setDescription(
                        `Press Pause or use /pause to pause the queue`
                    )
                    .setFooter({
                        text: `${interaction.user.username}`,
                        iconURL: interaction.user.avatarURL(),
                    })
                    .setTimestamp(),
            ],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`pauseButton`)
                        .setLabel(`Pause`)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji({
                            name: "Pause",
                            id: "1150516067983171755",
                        })
                ),
            ],
        })

        //queue.setPause()
    },
}
