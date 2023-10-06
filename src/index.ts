//const Discord = require("discord.js")
import {
    Client,
    GatewayIntentBits,
    Collection,
    Options,
    GuildMember,
} from "discord.js"
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"

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
    //lower cache limit to hopefully decrease memory usage
    makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        ReactionManager: 0,
        GuildMemberManager: {
            maxSize: 100, //default 200
            keepOverLimit: (member: GuildMember) =>
                member.id === client.user?.id,
        },
    }),
}) as Client & { slashcommands: Collection<string, any>; player: Player } //we define client object as a client and other elements we need

client.slashcommands = new Collection<string, any>()
client.player = new Player(client, {
    ytdlOptions: {
        quality: "highestaudio",
        highWaterMark: 1 << 25,
        requestOptions: {
            headers: {
                cookie: process.env.YT_COOKIES || "",
            },
        },
    },
})

//register extractors for youtube, spotify, and soundcloud
client.player.extractors.loadDefault()

registerPlayerEvents(client.player) //register player events

let commands = []

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
        .filter((file: string) => file.endsWith(".js"))
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
        .catch((err: Object) => {
            if (err) {
                console.log(err)
                process.exit(1)
            }
        })
} else {
    //want to exit after but its async so I dont know how to

    const clientPath = path.join(__dirname, "events", "client")
    const eventFiles = fs
        .readdirSync(clientPath)
        .filter((file: String) => file.endsWith(".js"))

    //register discord events
    for (const file of eventFiles) {
        const filePath = path.join(clientPath, file)
        const event = require(filePath)
        if (event.once) {
            client.once(event.name, (...args: any) => event.execute(...args))
        } else {
            client.on(event.name, (...args: any) => event.execute(...args))
        }
    }
    console.log(`registered client events`)

    //register database events
    const DBEventsPath = path.join(__dirname, "events", "mongo")
    const DBevents = fs
        .readdirSync(DBEventsPath)
        .filter((file: String) => file.endsWith(".js"))

    for (const file of DBevents) {
        const filePath = path.join(DBEventsPath, file)
        const event = require(filePath)
        if (event.once) {
            connection.once(event.name, (...args: any) =>
                event.execute(...args)
            )
        } else {
            connection.on(event.name, (...args: any) => event.execute(...args))
        }
    }
    console.log(`registered database events`)

    client.login(TOKEN)

    connect(DB_URL).catch(console.error)
}
