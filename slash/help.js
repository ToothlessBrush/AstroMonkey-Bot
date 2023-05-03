const { SlashCommandBuilder } = require("@discordjs/builders")
const { EmbedBuilder } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("show the bot commands"),

    run: async ({ client, interaction }) => {
        
        const description = `
        **General Commands**
        </help:1103275724183453708> - Displays the bot commands (what this is)
        </ping:1057468698987860099> - Displays the bots ping and websocket latency
        
        **Music Commands**
        </play:1046623522757296131> - Play a song or playlist from Youtube or Spotify
        </spotifysearch:1103280072074461274> - searches spotify for a prompt and adds first result to queue
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
        `

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setColor(0xA020F0) //purple
                .setTitle(`Help Menu`)
                .setDescription(description)
            ]
        })
    }
}