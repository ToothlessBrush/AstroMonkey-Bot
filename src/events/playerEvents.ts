import { Player } from "discord-player"
import { EmbedBuilder } from "discord.js"

module.exports.registerPlayerEvents = (player: Player) => {
    player.events.on("error", async (queue, error) => {
        console.log(
            `[${queue.guild.name}] Error emitted from the queue: ${error.message}`
        )

        const client = queue.player.client
        const interaction = queue.metadata.interaction

        try {
            await client.channels.cache.get(interaction.channelId).send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(`Somthing went wrong!`)
                        .setDescription(error.message.split("\n")[0]),
                ],
            })
        } catch (err) {
            console.error(err, "trying voice channel chat")
            try {
                await queue.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle(`Somthing went wrong!`)
                            .setDescription(error.message.split("\n")[0]),
                    ],
                })
            } catch (voiceTextErr) {
                console.error(voiceTextErr)
            }
        }
    })
    player.events.on("playerError", async (queue, error) => {
        console.log(
            `[${queue.guild.name}] Error emitted from the connection: ${error.message}`
        )

        const client = queue.player.client
        const interaction = queue.metadata.interaction

        try {
            await client.channels.cache.get(interaction.channelId).send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(`Somthing went wrong!`)
                        .setDescription(error.message.split("\n")[0]),
                ],
            })
        } catch (err) {
            console.error(err, "trying voice channel chat")
            try {
                await queue.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle(`Somthing went wrong!`)
                            .setDescription(error.message.split("\n")[0]),
                    ],
                })
            } catch (voiceTextErr) {
                console.error(voiceTextErr)
            }
        }
    })

    player.events.on("playerStart", (queue, track) => {
        console.log(
            `started: \"${track.title}\" in \"${queue.channel.name}\" | ${queue.guild.name}`
        )
    })

    player.events.on("audioTracksAdd", (queue, track) => {
        console.log(`${track} Added to Queue`)
    })
    player.events.on("disconnect", (queue) => {
        console.log(`bot disconnected`)
    })
    player.events.on("emptyChannel", (queue) => {
        console.log(`leaving due to empty channel`)
    })
    player.events.on("emptyQueue", (queue) => {
        console.log(`finished queue in ${queue.guild.name}`)
    })
}
