const { SlashCommandBuilder } = require("@discordjs/builders")
const { EmbedBuilder } = require("discord.js")
const { QueryType } = require("discord-player")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("play")
		.setDescription("loads songs from youtube")
		.addStringOption((option) => option.setName("query").setDescription("a search term, share link, or URL of the song").setRequired(true)),
        
	run: async ({ client, interaction }) => {
		if (!interaction.member.voice.channel) return interaction.editReply({embeds: [new EmbedBuilder().setColor(0xA020F0).setTitle(`You must be in a VC!`)]})

		const queue = await client.player.createQueue(interaction.guild)
		if (!queue.connection) await queue.connect(interaction.member.voice.channel)

		let embed = new EmbedBuilder() //need to change this to embed builder for v14 (done)

		
		 //plays a search term or url if not in playlist
        let url = interaction.options.getString("query")
        console.log("searching for song")
        const result_search = await client.player.search(url, { //change to result for normal search
            requestedBy: interaction.user,
            //searchEngine: QueryType.AUTO
        })
        let song
        //error checking
        if (result_search.tracks.length === 0) { //if it wasnt found try a different way
            //return interaction.editReply("No results")
            console.log("searching again...")
            const result_url = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_VIDEO
            })
            if (result_url.tracks.length === 0) { //if still not found send no results
                return interaction.editReply("No Results")
            } else { //sets song if found in second lookup
                song = result_url.tracks[0]
            }
        } else { //sets song if found in first lookup
            song = result_search.tracks[0]
        }

        console.log("adding " + song.title)
        //const song = result.tracks[0]
        await queue.addTrack(song)
            
        embed
            .setColor(0xA020F0) //purple
            .setDescription(`**[${song.title}](${song.url})** has been added to the Queue`)
            .setThumbnail(song.thumbnail)
            .setFooter({ text: `Duration: ${song.duration}`})
		
        if (!queue.playing) await queue.play()
        await interaction.editReply({
            embeds: [embed]
        })
	},
}