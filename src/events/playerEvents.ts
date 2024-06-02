import { GuildQueue, Player, useMetadata } from "discord-player";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Interaction,
} from "discord.js";

export const registerPlayerEvents = (player: Player) => {
    player.events.on("error", async (queue: GuildQueue, error: Error) => {
        console.log(
            `[${queue.guild.name}] Error emitted from the queue: ${error.message}`
        );

        console.log(queue.currentTrack, queue.tracks);
        1;
        type metaDataType = {
            interaction: Interaction;
        };

        const [getMetadata] = useMetadata<metaDataType>(queue);
        const metadata = getMetadata();
        const interaction = metadata?.interaction;

        if (queue.tracks.data.length == 0) {
            //destroy queue if no other tracks
            queue.delete();
        }

        if (interaction.isAutocomplete()) {
            //shouldnt be autocomplete but to be safe
            return;
        }

        try {
            await interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(`Somthing went wrong!`)
                        .setDescription(error.message.split("\n")[0]),
                ],
            });
        } catch (err) {
            console.error(err, "trying voice channel chat");
            try {
                await queue.channel?.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle(`Somthing went wrong!`)
                            .setDescription(error.message.split("\n")[0]),
                    ],
                });
            } catch (voiceTextErr) {
                console.error(voiceTextErr);
            }
        }
    });
    player.events.on(
        "playerError",
        async (queue: GuildQueue<unknown>, error: Error) => {
            console.log(
                `[${queue.guild.name}] Error emitted from the connection: ${error.message}`
            );

            type metaDataType = {
                interaction: Interaction;
            };

            const [getMetadata] = useMetadata<metaDataType>(queue);
            const metadata = getMetadata();
            const interaction = metadata?.interaction;

            if (queue.tracks.data.length == 0) {
                //destroy queue if no other tracks
                queue.delete();
            }

            if (interaction.isAutocomplete()) {
                //shouldnt be autocomplete but to be safe
                return;
            }

            const userMessage = error.message.includes(
                "Sign in to confirm your age"
            )
                ? "Cannot play age-restricted content!"
                : error.message.split("\n")[0];

            // if (error.message.includes("Sign in to confirm your age")) {
            //     return await interaction.followUp({
            //         embeds: [
            //             new EmbedBuilder()
            //                 .setColor(0xff0000)
            //                 .setTitle(`Somthing went wrong!`)
            //                 .setDescription(
            //                     "Cannot play age-restricted content!"
            //                 ),
            //         ],
            //     });
            // }

            try {
                await interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle(`Somthing went wrong!`)
                            .setDescription(userMessage),
                    ],
                });
            } catch (err) {
                console.error(err, "trying voice channel chat");
                try {
                    await queue.channel?.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xff0000)
                                .setTitle(`Somthing went wrong!`)
                                .setDescription(userMessage),
                        ],
                    });
                } catch (voiceTextErr) {
                    console.error(voiceTextErr);
                }
            }
        }
    );

    player.events.on("playerStart", (queue, track) => {
        console.log(
            `started: \"${track.title}\" in \"${queue.channel?.name}\" | ${queue.guild.name}`
        );
        //send data to website upstream if exists
    });

    player.events.on("audioTracksAdd", (queue, track) => {
        console.log(`${track} Added to Queue`);
        //send data to website upstream if exists
    });
    player.events.on("disconnect", (queue) => {
        console.log(`bot disconnected`);
    });
    player.events.on("emptyChannel", (queue) => {
        console.log(`leaving due to empty channel`);
    });
    player.events.on("emptyQueue", (queue) => {
        console.log(`finished queue in ${queue.guild.name}`);

        // type metaDataType = {
        //     interaction: ChatInputCommandInteraction;
        // };

        // const [getMetadata] = useMetadata<metaDataType>(queue);
        // const metadata = getMetadata();
        // const interaction = metadata?.interaction;

        // interaction?.followUp({
        //     embeds: [
        //         new EmbedBuilder()
        //             .setColor(0xa020f0)
        //             .setTitle(`Finished Queue in \`${queue.channel?.name}\``),
        //     ],
        //     components: [
        //         new ActionRowBuilder<ButtonBuilder>().addComponents(
        //             new ButtonBuilder()
        //                 .setStyle(ButtonStyle.Link)
        //                 .setLabel("Support AstroMonkey")
        //                 .setURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        //         ),
        //     ],
        // });
    });
    player.events.on("playerPause", (queue) => {
        //send data to website upstream if exists
    });
    
};
