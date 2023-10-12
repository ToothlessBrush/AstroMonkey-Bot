import { GuildQueue, Player, useMetadata } from "discord-player"
import { EmbedBuilder, Interaction } from "discord.js"

export const registerPlayerEvents = (player: Player) => {
    player.events.on("error", async (queue: GuildQueue, error: Error) => {
        console.log(
            `[${queue.guild.name}] Error emitted from the queue: ${error.message}`
        )

        type metaDataType = {
            interaction: Interaction
        }

        const [getMetadata] = useMetadata<metaDataType>(queue)
        const metadata = getMetadata()
        const interaction = metadata?.interaction

        if (interaction.isAutocomplete()) {
            //shouldnt be autocomplete but to be safe
            return
        }

        try {
            await interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(`Somthing went wrong!`)
                        .setDescription(error.message.split("\n")[0]),
                ],
            })
        } catch (err) {
            console.error(err, "trying voice channel chat")
            try {
                await queue.channel?.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle(`Somthing went wrong!`)
                            .setDescription(error.message.split("\n")[0]),
                    ],
                })
            } catch (voiceTextErr) {
                console.error(voiceTextErr)
            }
        }

        console.log(queue.tracks)
    })
    player.events.on(
        "playerError",
        async (queue: GuildQueue<unknown>, error: Error) => {
            console.log(
                `[${queue.guild.name}] Error emitted from the connection: ${error.message}`
            )

            type metaDataType = {
                interaction: Interaction
            }

            const [getMetadata] = useMetadata<metaDataType>(queue)
            const metadata = getMetadata()
            const interaction = metadata?.interaction

            if (interaction.isAutocomplete()) {
                //shouldnt be autocomplete but to be safe
                return
            }

            try {
                await interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle(`Somthing went wrong!`)
                            .setDescription(error.message.split("\n")[0]),
                    ],
                })
            } catch (err) {
                console.error(err, "trying voice channel chat")
                try {
                    await queue.channel?.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xff0000)
                                .setTitle(`Somthing went wrong!`)
                                .setDescription(error.message.split("\n")[0]),
                        ],
                    })
                } catch (voiceTextErr) {
                    console.error(voiceTextErr)
                }
            }

            console.log(queue.tracks)
        }
    )

    player.events.on("playerStart", (queue, track) => {
        console.log(
            `started: \"${track.title}\" in \"${queue.channel?.name}\" | ${queue.guild.name}`
        )
    })

    player.events.on("audioTracksAdd", (queue, track) => {
        console.log(`${track} Added to Queue`)
    })
    player.events.on("disconnect", (queue) => {
        console.log(`bot disconnected`)
    })
    player.events.on("emptyChannel", (queue) => {
        console.log(`leaving due to empty channel`)
    })
    player.events.on("emptyQueue", (queue) => {
        console.log(`finished queue in ${queue.guild.name}`)
    })
}
