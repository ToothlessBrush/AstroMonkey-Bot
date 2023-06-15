module.exports.registerPlayerEvents = (player) => {
    player.events.on("error", (queue, error) => {
        console.log(
            `[${queue.guild.name}] Error emitted from the queue: ${error.message}`
        )
    })
    player.events.on("playerError", (queue, error) => {
        console.log(
            `[${queue.guild.name}] Error emitted from the connection: ${error.message}`
        )
    })
    player.events.on("playerStart", (queue, track) => {
        console.log(
            `started: \"${track.title}\" in \"${queue.channel.name}\" | ${queue.guild.name}`
        )
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
