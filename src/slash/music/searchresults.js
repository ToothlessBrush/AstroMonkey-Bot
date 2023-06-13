const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder } = require('discord.js');
const { QueryType } = require("discord-player")

const { blackList } = require("./../../utils/blacklist")
const { isUrl } = require("./../../utils/isUrl")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("searchresults")
		.setDescription("get the search results for a prompts and choose which out of them to play")
        .addStringOption((option) => 
            option
                .setName("platform")
                .setDescription("the platform to search")
                .setRequired(true)
                .addChoices(
                    { name: "Youtube", value: "YOUTUBE" },
                    { name: "Spotify", value: "SPOTIFY" },
                    { name: "SoundCloud", value: "SOUNDCLOUD"}
                ))
		.addStringOption((option) => option.setName("query").setDescription("search term (use /play for url)").setRequired(true)),
        
	run: async ({ client, interaction }) => {
		if (!interaction.member.voice.channel) return interaction.editReply({embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`**You Must be in a VC!**`)]})

		 //plays a search term or url if not in playlist
        let query = interaction.options.getString("query")
        let platform = interaction.options.getString("platform")

        if (isUrl(query)) return interaction.editReply({embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`**query cant be url! use /play to use url.**`)]})

        let tracks
        if (platform == "YOUTUBE") { //auto searches the url
            console.log(`searching Youtube results for: ${query}`)
            
            interaction.editReply({embeds: [new EmbedBuilder().setColor(0x00cbb7).setTitle('Searching...').setDescription('Searching Youtube')]})

            const result_search = await client.player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_SEARCH
            })

            tracks = result_search.tracks //add multiple tracks if playlist/album

        }
        else if (platform == "SPOTIFY") { //searches youtube if its not a url
            console.log(`searching Spotify results for: ${query}`)
            
            interaction.editReply({embeds: [new EmbedBuilder().setColor(0x00cbb7).setTitle('Searching...').setDescription(`searching Spotify`)]})

            const result_search = await client.player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.SPOTIFY_SEARCH
            })

            tracks = result_search.tracks //adds 1 track from search
        }
        else if (platform == "SOUNDCLOUD") {
            console.log(`searching SoundCloud results for: ${query}`)

            interaction.editReply({embeds: [new EmbedBuilder().setColor(0x00cbb7).setTitle('Searching...').setDescription(`searching SoundCloud`)]})

            const result_search = await client.player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.SOUNDCLOUD_SEARCH
            })

            tracks = result_search.tracks
        }

        if (tracks.length === 0) {
            return interaction.editReply({embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`**No Results!**`)]})
        }

        //console.log(tracks)

        blackList(tracks, interaction)

        if (tracks.length == 0) {
            console.log(`cannot get tracks as all songs are removed or dont exist`)
            interaction.editReply({embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle(`Could not get tracks as all tracks were removed or don't exist`)]})
            return
        }
        
        const resultString = tracks.slice(0, 10).map((song, i) => {
            return `**${i+1}.** \`[${song.duration}]\` [${song.title}](${song.url})`
        }).join("\n")

        //build embed
        const resultembed = new EmbedBuilder()
            .setColor(0xA020F0)
            .setTitle("**Results**")
            .setDescription(resultString)
            .setFooter({text: "use the menu below to select track to add"})
        
        
        //build options based on results
        let options = []
        for (let i = 0; i < Math.min(tracks.length, 10); i++) {
            const option = new StringSelectMenuOptionBuilder()
                .setLabel(`${tracks[i].title}`)
                .setValue(`${tracks[i].url}`) //url of song is value
                .setDescription(`By ${tracks[i].author}`);
        
            options.push(option);
        }
        
        const songOptions = new StringSelectMenuBuilder()
            .setCustomId('select')
            .setPlaceholder('Select Track')
            .addOptions(options);

        const row = new ActionRowBuilder()
            .addComponents(songOptions)

        await interaction.editReply({
            embeds: [resultembed],
            components: [row],
        })

    }
}