import { Events, Guild } from "discord.js"
import { Server } from "../../model/Server"

export default {
    name: Events.GuildDelete,
    async execute(guild: Guild) {
        try {
            const deletedServer = await Server.findOneAndDelete({
                "server.ID": guild.id,
            })

            if (deletedServer) {
                console.log(
                    `Server: ${guild.name} kicked me! removed data assosiated with ${guild.name}`
                )
            } else {
                console.log(
                    `Server: ${guild.name} kicked me! there was no data assosiated with ${guild.name}`
                )
            }
        } catch (error) {
            console.error(error)
        }
    },
}
