module.exports.registerPlayerEvents = (player) => {

    player.on("error", (queue, error) => {
        console.log(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);
    });
    player.on("connectionError", (queue, error) => {
        console.log(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
    });
    
    player.on("trackStart", (queue, track) => {
        console.log(`started: \"${track.title}\" in \"${queue.connection.channel.name}\" | ${queue.guild.name}`)
    });
    player.on("trackAdd", (queue, track) => {
        
    })
    player.on("botDisconnect", (queue) => {
        console.log(`bot manually disconnected from ${queue.connection.channel.name}`)
    })
    player.on("channelEmpty", (queue) => {
        console.log(`leaving due to empty channel`)
    })
    player.on("queueEnd", (queue) => {
        console.log(`finished queue in ${queue.guild.name}`)
    })

};