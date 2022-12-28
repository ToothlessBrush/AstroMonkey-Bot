const { SlashCommandBuilder } = require("@discordjs/builders")
const { QueueRepeatMode } = require("discord-player")
const { EmbedBuilder } = require("discord.js")

module.exports = {
	data: new SlashCommandBuilder()
        .setName("loop")
        .setDescription("loops current song or queue")
        .addStringOption((option) => 
            option
                .setName("mode")
                .setDescription("the repeat mode you want")
                .setRequired(true)
                .addChoices(
                    { name: "OFF", value: "OFF" },
                    { name: "Queue", value: "QUEUE" },
                    { name: "Track", value: "TRACK" },
                )),
	
    run: async ({ client, interaction }) => {
		const queue = client.player.getQueue(interaction.guildId)
        
        if (!queue) {
            return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xA020F0).setDescription(`**no song is currently playing**`)]})
        }
        
        const loopMode = interaction.options.getString("mode")

        let embed = new EmbedBuilder()

        embed.setColor(0xA020F0)
        
        if (loopMode === "OFF") {
            await queue.setRepeatMode(QueueRepeatMode.OFF)
            embed.setDescription(`**Stopped Looping**`)
        }
        else if (loopMode === `TRACK`) {
            await queue.setRepeatMode(QueueRepeatMode.TRACK)
            embed.setDescription(`**Looping the Current Track**`)
        }
        else if (loopMode === `QUEUE`) {
            await queue.setRepeatMode(QueueRepeatMode.QUEUE)
            embed.setDescription(`**Looping the Queue**`)
        }

        await interaction.editReply({
            embeds: [embed]
        })
    }
}