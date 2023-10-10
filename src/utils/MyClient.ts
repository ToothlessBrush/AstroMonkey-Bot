import { Client, Collection } from "discord.js"
import { Player } from "discord-player"

//MyClient is a Discordjs client with slashcommands and player paramaters
export default interface MyClient extends Client {
    slashcommands: Collection<string, any>
    player: Player
}