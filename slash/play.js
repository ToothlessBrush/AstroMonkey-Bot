const { SlashCommandBuilder, ButtonBuilder } = require("@discordjs/builders")
const { EmbedBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js")
const { QueryType, Playlist } = require("discord-player")

blackListedSong = [
    "https://open.spotify.com/track/2ZpkUn9s1jgKGxsPWnbtMq"
]

module.exports = {
	data: new SlashCommandBuilder()
		.setName("play")
		.setDescription("loads songs from youtube")
		.addStringOption((option) => option.setName("query").setDescription("a search term, share link, or URL of the song").setRequired(true)),
        
	run: async ({ client, interaction }) => {
		if (!interaction.member.voice.channel) return interaction.editReply({embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`**You Must be in a VC!**`)]})

		const queue = await client.player.nodes.create(interaction.guild, {
            metadata: {
            channel: interaction.channel,
            client: interaction.guild.members.me,
            requestedBy: interaction.user,
            },
            selfDeaf: true,
            volume: 80,
            leaveOnEmpty: true,
            leaveOnEnd: true,
        })

		if (!queue.connection) await queue.connect(interaction.member.voice.channel)

		let embed = new EmbedBuilder() //need to change this to embed builder for v14 (done)

		 //plays a search term or url if not in playlist
        let query = interaction.options.getString("query")

        let tracks
        if (isUrl(query)) { //auto searches the url
            console.log(`searching url: ${query}`)
            
            interaction.editReply({embeds: [new EmbedBuilder().setColor(0x00cbb7).setTitle('Searching...').setDescription('searching URL ')]})

            const result_search = await client.player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO
            })

            tracks = result_search.tracks //add multiple tracks if playlist/album

        }
        else { //searches youtube if its not a url
            console.log(`searching prompt: ${query}`)
            
            interaction.editReply({embeds: [new EmbedBuilder().setColor(0x00cbb7).setTitle('Searching...').setDescription(`searching youtube for ${query}`)]})

            const result_search = await client.player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_SEARCH
            })

            tracks = [result_search.tracks[0]] //adds 1 track from search
        }

        if (tracks.length === 0) {
            return interaction.editReply({embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`**No Results!**`)]})
        }

        //console.log(tracks)

        blackList(tracks, blackListedSong, interaction)

        if (tracks.length == 0) {
            console.log(`cannot start playing as all songs are removed or dont exist`)
            interaction.editReply({embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle(`Could not start playing as all tracks were removed or don't exist`)]})
            return
        }
        
        await queue.addTrack(tracks) //adds track(s) from the search result
            
        try { //verify vc connection
            if(!queue.connection){
                await queue.connect(interaction.member.voice.channel)
            }
        } catch (error) {
            queue.delete()
            console.log(error)
            return await interaction.editReply({ content: "could not join voice channel"})
        }
        
        if (!queue.node.isPlaying()) await queue.node.play() //play if not already playing
        
        //console.log(tracks)
        
        //build embed based on info 
        if (tracks.length > 1) {
            playlist = tracks[0].playlist
            //console.log(tracks)
            
            embed
                .setColor(0xA020F0) //purple
                .setTitle(`Queued ${tracks.length} Tracks`)
                //.setDescription(`**[${playlist.title}](${playlist.url})**`) //doesnt work for spotify
                .setThumbnail(tracks[0].thumbnail)
                .setFooter({ text: `source: ${tracks[0].source}`})
        }
        else {
            if (queue.tracks.size == 0) {
                embed
                    .setColor(0xA020F0) //purple
                    .setTitle(`**Playing**`)
                    .setDescription(`**[${tracks[0].title}](${tracks[0].url})**\nBy ${tracks[0].author}`)
                    .setThumbnail(tracks[0].thumbnail)
                    .setFooter({ text: `Duration: ${tracks[0].duration} | source: ${tracks[0].source}`})
            } else {
                embed
                    .setColor(0xA020F0) //purple
                    .setTitle(`**Queued in Position ${queue.tracks.size}**`)
                    .setDescription(`**[${tracks[0].title}](${tracks[0].url})**\nBy ${tracks[0].author}`)
                    .setThumbnail(tracks[0].thumbnail)
                    .setFooter({ text: `Duration: ${tracks[0].duration} | Source: ${tracks[0].source}`})
            }
        }

        //console.log(queue.tracks.length)   
        
        await interaction.editReply({
            embeds: [embed],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`pauseButton`)
                            .setLabel(`Pause`)
                            .setStyle(ButtonStyle.Secondary)
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`skipButton`)
                            .setLabel(`Skip`)
                            .setStyle(ButtonStyle.Secondary)
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`queueButton`)
                            .setLabel(`Queue`)
                            .setStyle(ButtonStyle.Secondary)
                    )
            ]
        })
	},
}

/* does not work with soundcloud urls
function isUrl(urlString) {
  // Regular expression for validating URLs
  var urlPattern = new RegExp('^(https?:\\/\\/)?' +
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
    '((\\d{1,3}\\.){3}\\d{1,3}))' +
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
    '(\\?[;&a-z\\d%_.~+=-]*)?' +
    '(\\#[-a-z\\d_]*)?$','i');

  return !!urlPattern.test(urlString);
}
*/
function isUrl(urlString) {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  }
  

function blackList(tracks, blackList, interaction) {
    let removed = []
    for (let i = 0; i < tracks.length; i++) {
        if (blackList.includes(tracks[i].url)) {
            removed.push(tracks[i])
            tracks.splice(i, 1)
            i-- //array shifts one left when element removed
        }
    }
    if (removed.length > 0) {
        console.log(`removed: ${removed} via blakcList`)
        interaction.editReply(`the following songs have issues extracting and were removed: ${removed}`)
    }
}