import { Events } from "discord.js"

export default {
    name: Events.Error,
    execute(error: Error) {
        console.error(error)
    },
}
