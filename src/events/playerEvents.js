const { EmbedBuilder } = require("discord.js")

module.exports.registerPlayerEvents = (player) => {
    player.events.on("error", async (queue, error) => {
        console.log(
            `[${queue.guild.name}] Error emitted from the queue: ${error.message}`
        )

        await queue.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle(`Somthing went wrong!`)
                    .setDescription(error.message.split("\n")[0]),
            ],
        })
    })
    player.events.on("playerError", async (queue, error) => {
        console.log(
            `[${queue.guild.name}] Error emitted from the connection: ${error.message}`
        )

        const client = queue.player.client
        const interaction = queue.interaction

        await client.channels.cache.get(interaction.channelId).send({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle(`Somthing went wrong!`)
                    .setDescription(error.message.split("\n")[0]),
            ],
        })
    })

    player.events.on("playerStart", (queue, track) => {
        console.log(
            `started: \"${track.title}\" in \"${queue.channel.name}\" | ${queue.guild.name}`
        )

        // process.on("uncaughtException", async (error) => {
        //     console.log("here2", error)
        //     await queue.channel.send({
        //         embeds: [
        //             new EmbedBuilder()
        //                 .setColor(0xff0000)
        //                 .setTitle(`Somthing went wrong!`)
        //                 .setDescription(error.message.split("\n")[0]),
        //         ],
        //     })

        //     if (!queue.node.isPlaying() && queue.tracks.size >= 1) {
        //         await queue.node.play()
        //     }
        // })
    })

    player.events.on("audioTracksAdd", (queue, track) => {})
    player.events.on("disconnect", (queue) => {
        console.log(
            `bot disconnected from ${queue.channel.name} | ${queue.guild.name}`
        )
    })
    player.events.on("emptyChannel", (queue) => {
        console.log(`leaving due to empty channel`)
    })
    player.events.on("emptyQueue", (queue) => {
        console.log(`finished queue in ${queue.guild.name}`)
    })
}
