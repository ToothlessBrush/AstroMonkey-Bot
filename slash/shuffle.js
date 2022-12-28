const { EmbedBuilder } = require("@discordjs/builders");
const { SlashCommandBuilder } = require("discord.js");


module.exports = {
    data: new SlashCommandBuilder()
        .setName("shuffle")
        .setDescription("shuffles the music queue"),
    
    run: async ({ client, interaction }) => {
        const queue = client.player.getQueue(interaction.guildId)

        if (!queue) {
            return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xA020F0).setDescription(`**no song is currently playing**`)]})
        }

        await queue.shuffle()
        
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xA020F0)
                    .setTitle("**Shuffled the Queue**")
            ]
        })

    }
}