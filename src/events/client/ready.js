const { ActivityType } = require("discord.js")
const chalk = require("chalk")

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        console.log(chalk.green(chalk.green(`Logged in as ${client.user.tag}`)))
        client.user.setStatus("available")
        client.user.setActivity({
            name: "/help",
            type: ActivityType.Streaming,
        })
    },
}
