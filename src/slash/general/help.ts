import { SlashCommandBuilder } from "@discordjs/builders"
import {
    EmbedBuilder,
    CommandInteraction,
    ChatInputCommandInteraction,
} from "discord.js"

export default class Help {
    constructor() {}
    data = new SlashCommandBuilder()
        .setName("help")
        .setDescription("show the bot commands")

    async run(interaction: ChatInputCommandInteraction) {
        const description = `
        **General Commands**
        </help:1103275724183453708> - Displays the bot commands (what this is)
        </ping:1057468698987860099> - Displays the bots ping and websocket latency
        
        **Music Commands**
        </play:1046623522757296131> - Play a song or playlist from Youtube or Spotify
        </spotifysearch:1103280072074461274> - searches spotify for a prompt and adds first result to queue
        </soundcloudsearch:1118343525143162921> - searches soundcloud for a prompt and adds first result to queue
        </searchresults:1104006453498478724> - get the search results of a prompt and choose which to play
        </playnow:1144360988448145541> - skips queue to play a track instantly
        </skip:1046623522757296135> - Skips the currently playing song
        </pause:1046623522757296130> - Pause the current song
        </resume:1046623522757296134> - Resume the current song
        </queue:1046623522757296132> - Display the current songs in queue
        </info:1057464051082481664> - Display info on the current song
        </volume:1057545219081511002> - set the volume of the bot (reset when queue stopped)
        </loop:1057486871975972914> - Loop the current track or queue
        </shuffle:1057540181177147392> - shuffles the queue
        </playlast:1057495639887462441> - Play the previously played song
        </quit:1046623522757296133> - Deletes queue and disconnects bot

        **Playlist Commands**
        **Playlists** let you save a list of songs to easily play later. everybody has a **Likes** playlist and everyone can create a **user** or **server** playlist. **user** playlists can only be modified by yourself while **server** playlists are shared with everybody in a server.
        
        </create-playlist:1138955261441224825> - create a playlist for yourself or everyone.
        </playlist-add:1138955261441224829> - add a track to a playlist
        </playlist-remove:1138955261441224830> - remove a track from a playlist
        </like:1138955261441224827> - add a track to your likes playlist you can also do playlist-add likes
        </queue-playlist:1138955261441224831> - add the playlist tracks to the queue with an option to shuffle
        </list-playlists:1138955261441224828> - list all your playlist as well as the server playlist
        </view-playlist:1138955261441224832> - view the tracks within a playlist
        </delete-playlist:1138955261441224826> - delete a playlist *only the owner of a playlist can delete it
        </playlist-now:1144360988448145542> - skips current queue to play a playlist instantly
        `

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0) //purple
                    .setTitle(`Help Menu`)
                    .setDescription(description),
            ],
        })
    }
}
