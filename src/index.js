//const Discord = require("discord.js")
const { Client, GatewayIntentBits, Collection } = require("discord.js")
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")

const { connect, connection } = require("mongoose")

const fs = require("fs")
const path = require("path")

const { Player } = require("discord-player")
const dotenv = require("dotenv")

const { registerPlayerEvents } = require("./events/playerEvents")

dotenv.config()
const TOKEN = process.env.TOKEN
const CLIENT_ID = process.env.CLIENT_ID
const DB_URL = process.env.DB_URL

const LOAD_SLASH = process.argv[2] == "load"
const GLOBAL = process.argv[3] == "global"

//const CLIENT_ID = "892848741860638781"
const GUILD_ID = "892850656002600960" //test server

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
})

client.slashcommands = new Collection()
client.player = new Player(client, {
    ytdlOptions: {
        quality: "highestaudio",
        highWaterMark: 1 << 25,
    },
})

//register extractor
client.player.extractors.loadDefault()

registerPlayerEvents(client.player) //register player events

let commands = []

const slashDirectory = path.join(__dirname, "slash")
const subDir = fs
    .readdirSync(slashDirectory)
    .filter((file) =>
        fs.statSync(path.join(slashDirectory, file)).isDirectory()
    )

//register commands
for (const dir of subDir) {
    const slashFiles = fs
        .readdirSync(path.join(slashDirectory, dir))
        .filter((file) => file.endsWith(".js"))
    for (const file of slashFiles) {
        const slashcmd = require(path.join(slashDirectory, dir, file))
        client.slashcommands.set(slashcmd.data.name, slashcmd)
        if (LOAD_SLASH) {
            commands.push(slashcmd.data.toJSON()) //.toJSON because it can catch errors I think
            //console.log(slashcmd.data)
        }
    }
}

if (LOAD_SLASH) {
    const rest = new REST({ version: "9" }).setToken(TOKEN)
    console.log("Deploying slash commands")
    const route = GLOBAL
        ? Routes.applicationCommands(CLIENT_ID)
        : Routes.applicationCommands(CLIENT_ID, GUILD_ID)
    rest.put(route, { body: commands })
        .then(() => {
            console.log(
                `Successfully loaded commands ${
                    GLOBAL ? "globally" : "locally"
                }`
            )
            process.exit(0)
        })
        .catch((err) => {
            if (err) {
                console.log(err)
                process.exit(1)
            }
        })
} else {
    const clientPath = path.join(__dirname, "events", "client")
    const eventFiles = fs
        .readdirSync(clientPath)
        .filter((file) => file.endsWith(".js"))

    //register discord events
    for (const file of eventFiles) {
        const filePath = path.join(clientPath, file)
        const event = require(filePath)
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args))
        } else {
            client.on(event.name, (...args) => event.execute(...args))
        }
    }

    //register database events
    const DBEventsPath = path.join(__dirname, "events", "mongo")
    const DBevents = fs
        .readdirSync(DBEventsPath)
        .filter((file) => file.endsWith(".js"))

    for (const file of DBevents) {
        const filePath = path.join(DBEventsPath, file)
        const event = require(filePath)
        if (event.once) {
            connection.once(event.name, (...args) => event.execute(...args))
        } else {
            connection.on(event.name, (...args) => event.execute(...args))
        }
    }

    client.login(TOKEN)
    ;(async () => {
        await connect(DB_URL).catch(console.error)
    })()
}
