//const Discord = require("discord.js")
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const dotenv = require("dotenv")
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")
const fs = require("fs")
const { Player } = require("discord-player")

dotenv.config()
const TOKEN = process.env.TOKEN

const LOAD_SLASH = process.argv[2] == "load"

const CLIENT_ID = "892848741860638781"
const GUILD_ID = "892850656002600960"

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
    rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {body: commands}) //.applicationCommands(clientId) for global
    .then(() => {
        console.log("Successfully loaded")
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
    })

    client.on("interactionCreate", (interaction) => {
        async function handleCommand() {
            //console.log(interaction)
            
            if (interaction.isChatInputCommand()) {

                console.log(interaction.commandName)

                const slashcmd = client.slashcommands.get(interaction.commandName)
                if (!slashcmd) interaction.reply("Not a valid slash command")

                await interaction.deferReply()
                await slashcmd.run({ client, interaction })
            
            } else if (interaction.isButton()) {
                
                // console.log(interaction.customId)
                
                //await interaction.deferReply()
                
                const customId = interaction.customId.split("_")[0];
                console.log(customId)
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
                        queue(interaction, 0, 0)
                        return
                    case ("skipButton"):
                        command = "skip"
                        break
                    case ("nextPageButton"):
                        queue(interaction, parseInt(interaction.customId.split("_")[1]), 1)
                        //console.log(interaction.customId.split("_")[1])
                        return
                    case ("prevPageButton"):
                        queue(interaction, parseInt(interaction.customId.split("_")[1]), 1)                        //console.log(interaction.customId.split("_")[1])
                        return
                    default:
                        return                
                }

                await interaction.deferReply()
                await client.slashcommands.get(command).run({ client, interaction })
            
            } else {
                return
            }
        } 
        
        handleCommand()
    })
    client.login(TOKEN)
}

//probably bad coding but couldn't figure out how to get queue button to work
async function queue(interaction, pageNumber, update) {
    const queue = client.player.getQueue(interaction.guildId)
    if (!queue || !queue.playing){
        return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xA020F0).setDescription(`**No Music in Queue!**`)]})
    }

    let totalPages = Math.ceil(queue.tracks.length / 10)
    if (totalPages == 0) { //set pages to 1 when song playing but no queue
        totalPages = 1
    }
        
    const page = pageNumber

    if (page >= totalPages) {
        return await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xA020F0).setTitle(`Invalid Page!`).setDescription(`there are only ${totalPages} pages`)]})
    }

    const queueString = queue.tracks.slice(page * 10, page * 10 + 10).map((song, i) => {
        return `**${page * 10 + i + 1}.** \`[${song.duration}]\` [${song.title}](${song.url})\n**Requested By: <@${song.requestedBy.id}>**`
    }).join("\n")

    const currentSong = queue.current

    let prevPage
    if (page == 0) {
        prevPage = 0
    } else {
        prevPage = page - 1
    }

    let nextPage
    if ((page + 1) == totalPages) {
        nextPage = page
    } else {
        nextPage = page + 1 
    }
    
    const embed = new EmbedBuilder()
        .setColor(0xA020F0)
        .setDescription(`**Currently Playing**\n` + 
        (currentSong ? `\`[${currentSong.duration}]\` [${currentSong.title}](${currentSong.url})\n**Requested by: <@${currentSong.requestedBy.id}>**` : "None") +
        `\n\n**Queue**\n${queueString}`
        )
        .setFooter({
            text: `Page ${page + 1} of ${totalPages}`
        })
        .setThumbnail(currentSong.thumbnail)

    let component = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`prevPageButton_${prevPage}`)
                .setLabel(`<`)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`nextPageButton_${nextPage}`)
                .setLabel(`>`)
                .setStyle(ButtonStyle.Secondary)                             
        )
    
    if (update == 1) {
        await interaction.update({
            embeds: [embed],
            components: [component]
        })
    } else {
        await interaction.editReply({
            embeds: [embed],
            components: [component]
        })    
    }
}