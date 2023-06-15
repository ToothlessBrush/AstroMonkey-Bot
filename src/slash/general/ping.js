const { SlashCommandBuilder } = require("@discordjs/builders")
const { EmbedBuilder } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("replies with the latency of the bot"),

    run: async ({ client, interaction }) => {
        const mesg = await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(0xa020f0).setTitle(`Pong!`)],
            fetchReply: true,
        })

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0) //purple
                    .setTitle(`Pong!`)
                    .setDescription(
                        `Bot Latency: \`${
                            mesg.createdTimestamp - interaction.createdTimestamp
                        }ms\`, \nWebsocket Latency: \`${client.ws.ping}ms\``
                    ),
            ],
        })
    },
}
