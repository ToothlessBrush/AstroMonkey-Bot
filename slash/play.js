const { SlashCommandBuilder, ButtonBuilder } = require("@discordjs/builders")
const { EmbedBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js")
const { QueryType } = require("discord-player")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("play")
		.setDescription("loads songs from youtube")
		.addStringOption((option) => option.setName("query").setDescription("a search term, share link, or URL of the song").setRequired(true)),
        
	run: async ({ client, interaction }) => {
		if (!interaction.member.voice.channel) return interaction.editReply({embeds: [new EmbedBuilder().setColor(0xA020F0).setDescription(`**You Must be in a VC!**`)]})

		const queue = await client.player.createQueue(interaction.guild)
		if (!queue.connection) await queue.connect(interaction.member.voice.channel)

		let embed = new EmbedBuilder() //need to change this to embed builder for v14 (done)

		
		 //plays a search term or url if not in playlist
        let url = interaction.options.getString("query")
        
        //plays dr fauci when joey plays
        if (interaction.user.id == 298552929596604418) {
            url = "dr fauci trap nightcore"
        }

        //console.log("searching for song")
        const result_search = await client.player.search(url, { //change to result for normal search
            requestedBy: interaction.user,
            //searchEngine: QueryType.AUTO
        })
        let song
        //error checking
        if (result_search.tracks.length === 0) { //if it wasnt found try a different way
            //return interaction.editReply("No results")
            //console.log("searching again...")
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

        console.log("Adding: " + song.title)
        //const song = result.tracks[0]
        await queue.addTrack(song)
            
        //verify vc connection
        try {
            if(!queue.connection){
                await queue.connect(interaction.member.voice.channel)
            }
            //interaction.followUp({ content: `Playing ${songTitle}` });
        } catch (error) {
            queue.destroy()
            console.log(error)
            return await interaction.editReply({ content: "could not join voice channel"})
        }
        
        if (!queue.playing) await queue.play()

        //build embed based on info 
        if (queue.tracks.length == 0) {
            embed
                .setColor(0xA020F0) //purple
                .setTitle(`**Playing**`)
                .setDescription(`**[${song.title}](${song.url})**`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Duration: ${song.duration}`})
        } else {
            embed
                .setColor(0xA020F0) //purple
                .setTitle(`**Queued in Position ${queue.tracks.length}**`)
                .setDescription(`**[${song.title}](${song.url})**`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Duration: ${song.duration}`})
        }

        console.log(queue.tracks.length)     

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