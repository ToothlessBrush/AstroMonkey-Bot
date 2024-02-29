import { Client, Collection } from "discord.js";
import { Player } from "discord-player";
import BaseCommand from "./BaseCommand";

//MyClient is a Discordjs client with slashcommands and player paramaters
export default interface MyClient extends Client {
    commands: Collection<string, BaseCommand>;
    player: Player;
}
