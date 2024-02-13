import {
    Client,
    GatewayIntentBits,
    Collection,
    Options,
    GuildMember,
} from "discord.js"
import MyClient from "./utils/MyClient"
import { REST } from "@discordjs/rest"

import { connect, connection } from "mongoose"

import fs from "fs"
import path from "path"

import { Player } from "discord-player"

import { registerPlayerEvents } from "./events/playerEvents"

const ENVIORNMENT = process.env.NODE_ENV || "dev"

//get env file based on enviornment
require("dotenv").config({
    path: path.join(__dirname, `..`, `.env.${ENVIORNMENT}`),
})

const CONFIG = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, `..`, `config.${ENVIORNMENT}.json`),
        "utf-8"
    )
)

//get env variables
const TOKEN = process.env.TOKEN || ""
const DB_URL = process.env.DB_URL || ""

//get config variables
const CLIENT_ID = CONFIG.CLIENT_ID || ""
const GUILD_ID = CONFIG.GUILD_ID || ""

const LOAD_SLASH = process.argv[2] == "load"
const GLOBAL = process.argv[3] == "global"

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
    //lower cache limit to hopefully decrease memory usage (didnt work)
    makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        ReactionManager: 0,
        GuildMemberManager: {
            maxSize: 200, //default 200
            keepOverLimit: (member: GuildMember) =>
                member.id === client.user?.id,
        },
    }),
    sweepers: Options.DefaultSweeperSettings,
}) as MyClient

client.commands = new Collection<string, any>()
client.player = new Player(client, {
    ytdlOptions: {
        quality: "highestaudio",
        highWaterMark: 1 << 25,
        // requestOptions: {
        //     headers: {
        //         cookie: process.env.YT_COOKIES || "",
        //     },
        // },
    },
})

//register extractors for youtube, spotify, and soundcloud
client.player.extractors.loadDefault()

registerPlayerEvents(client.player) //register player events

let commands: any[] = []

const slashDirectory = path.join(__dirname, "slash")
const subDir = fs
    .readdirSync(slashDirectory)
    .filter((file: string) =>
        fs.statSync(path.join(slashDirectory, file)).isDirectory()
    )

//register commands
for (const dir of subDir) {
    const slashFiles = fs
        .readdirSync(path.join(slashDirectory, dir))
        .filter((file: string) => file.endsWith(".ts") || file.endsWith(`.js`))
    for (const file of slashFiles) {
        //console.log(slashDirectory + "/" + dir + "/" + file)
        const commandClass = require(path.join(
            slashDirectory,
            dir,
            file
        )).default
        const commandInstance = new commandClass()
        client.commands.set(commandInstance.data.name, commandInstance)
        if (LOAD_SLASH) {
            commands.push(commandInstance.data.toJSON())
        }
    }
}

if (LOAD_SLASH) {
    const rest = new REST({ version: "9" }).setToken(TOKEN)
    console.log("Deploying slash commands")
    const route = GLOBAL //input sting manually (replaces applicationCommands(applicationId: string): `/applications/${string}/commands`) for typescript
        ? (`/applications/${CLIENT_ID}/commands` as `/${string}`)
        : (`/applications/${CLIENT_ID}/guilds/${GUILD_ID}/commands` as `/${string}`)
    rest.put(route, { body: commands })
        .then(() => {
            console.log(
                `Successfully loaded commands ${
                    GLOBAL ? "globally" : "locally"
                }`
            )
            process.exit(0)
        })
        .catch((err: Error) => {
            if (err) {
                console.error(err)
                process.exit(1)
            }
        })
} else {
    //want to exit after but its async so I dont know how to

    const clientPath = path.join(__dirname, "events", "client")
    const eventFiles = fs
        .readdirSync(clientPath)
        .filter((file: string) => file.endsWith(".ts") || file.endsWith(`.js`))

    //register discord events
    for (const file of eventFiles) {
        const filePath = path.join(clientPath, file)
        const event = require(filePath).default
        try {
            if (event.once) {
                client.once(event.name, (...args: any) =>
                    event.execute(...args)
                )
            } else {
                client.on(event.name, (...args: any) => event.execute(...args))
            }
        } catch (err) {
            console.log(`error while importing discord event files: ${err}`)
        }
    }
    console.log(`registered client events`)

    //register database events
    const DBEventsPath = path.join(__dirname, "events", "mongo")
    const DBevents = fs
        .readdirSync(DBEventsPath)
        .filter((file: string) => file.endsWith(".ts") || file.endsWith(`.js`))

    for (const file of DBevents) {
        const filePath = path.join(DBEventsPath, file)
        const event = require(filePath).default
        try {
            if (event.once) {
                connection.once(event.name, (...args: any) =>
                    event.execute(...args)
                )
            } else {
                connection.on(event.name, (...args: any) =>
                    event.execute(...args)
                )
            }
        } catch (err) {
            console.error(`Error while importing db event files: ${err}`)
        }
    }
    console.log(`registered database events`)

    client.login(TOKEN)

    connect(DB_URL).catch(console.error)
}
