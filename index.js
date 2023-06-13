//const Discord = require("discord.js")
const { Client, GatewayIntentBits, Collection, InteractionCollector, ActivityType } = require('discord.js');
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")
const fs = require("fs")
const { Player } = require("discord-player")
const dotenv = require("dotenv")

const { registerPlayerEvents } = require('./functions/events');
const { queueButton } = require("./functions/queueButton")

dotenv.config()
const TOKEN = process.env.TOKEN
const CLIENT_ID = process.env.CLIENT_ID

const LOAD_SLASH = process.argv[2] == "load"
const GLOBAL = process.argv[3] == "global"

//const CLIENT_ID = "892848741860638781"
const GUILD_ID = "892850656002600960" //test server

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
    ]
})

client.slashcommands = new Collection()
client.player = new Player(client, {
    ytdlOptions: {
        quality: "highestaudio",
        highWaterMark: 1 << 25
    }
})

registerPlayerEvents(client.player);

let commands = []

const slashFiles = fs.readdirSync("./slash").filter(file => file.endsWith(".js"))
for (const file of slashFiles){
    const slashcmd = require(`./slash/${file}`)
    client.slashcommands.set(slashcmd.data.name, slashcmd)
    if (LOAD_SLASH) {
        commands.push(slashcmd.data.toJSON()) //.toJSON because it can catch errors I think
        //console.log(slashcmd.data)
    }
}

if (LOAD_SLASH) {
    const rest = new REST({ version: "9" }).setToken(TOKEN)
    console.log("Deploying slash commands")
    const route = GLOBAL ? Routes.applicationCommands(CLIENT_ID) : Routes.applicationCommands(CLIENT_ID, GUILD_ID)
    rest.put(route, { body: commands })
    .then(() => {
        console.log(`Successfully loaded commands ${GLOBAL ? 'globally' : 'locally'}`)
        process.exit(0)
    })
    .catch((err) => {
        if (err){
            console.log(err)
            process.exit(1)
        }
    })
}
else {
    
    client.on("ready", () => {
        console.log(`Logged in as ${client.user.tag}`)
        client.user.setStatus('available')
        client.user.setActivity({
            name: '/help',
            type: ActivityType.Streaming
          });
    })

    client.on("interactionCreate", (interaction) => {
        async function handleCommand() {
            //console.log(interaction)
            
            if (interaction.isChatInputCommand()) {

                console.log(`Interaction: ${interaction.commandName}`)

                const slashcmd = client.slashcommands.get(interaction.commandName)
                if (!slashcmd) interaction.reply("Not a valid slash command")

                await interaction.deferReply()
                await slashcmd.run({ client, interaction })
            
            } else if (interaction.isButton()) {
                
                // console.log(interaction.customId)
                
                //await interaction.deferReply()
                
                const customId = interaction.customId.split("_")[0];
                console.log(`Button: ${customId}`)
                let command

                switch (customId) {
                    case ("resumeButton"):
                        command = "resume"
                        break
                    case ("pauseButton"):
                        command = "pause"
                        break
                    case ("queueButton"):
                        await interaction.deferReply()
                        queueButton(client, interaction, 0, false)
                        return
                    case ("skipButton"):
                        command = "skip"
                        break
                    case ("nextPageButton"):
                        queueButton(client, interaction, parseInt(interaction.customId.split("_")[1]), true)
                        //console.log(interaction.customId.split("_")[1])
                        return
                    case ("refreshQueue"):
                        queueButton(client, interaction, 0, true)
                        return
                    case ("prevPageButton"):
                        queueButton(client, interaction, parseInt(interaction.customId.split("_")[1]), true)                        //console.log(interaction.customId.split("_")[1])
                        return
                    default:
                        return                
                }

                await interaction.deferReply()
                await client.slashcommands.get(command).run({ client, interaction })
            
            } else if (interaction.isStringSelectMenu()) {
                const optionValue = interaction.values[0]
                const optionID = interaction.customId
                console.log(`option: ${optionID} value: ${optionValue}`)
                if (optionID == "select") {
                    await interaction.deferReply()
                    await client.slashcommands.get("play").run({ client, interaction });
                    
                }
            } else {
                return
            }
        } 
        
        handleCommand()
    })
    client.login(TOKEN)
}