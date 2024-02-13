import {
    EmbedBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CommandInteraction,
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    InteractionResponse,
    Message,
    ComponentType,
} from "discord.js";

import { Server } from "./../../model/Server.js";
import { User } from "./../../model/User.js";
import { IPlaylist } from "../../model/Playlist.js";

export default class ViewPlaylist {
    playlist: IPlaylist | undefined;

    constructor() {
        this.playlist = undefined;
    }

    data = new SlashCommandBuilder()
        .setName("view-playlist")
        .setDescription("view the contents of a playlist")
        .addStringOption((option) =>
            option
                .setName("playlist")
                .setDescription("name of the playlists you would like to view")
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addNumberOption((option) =>
            option
                .setName("page")
                .setDescription("page number")
                .setRequired(false)
                .setMinValue(1)
        );

    async autocomplete(interaction: AutocompleteInteraction) {
        const focusedValue = interaction.options.getFocused();

        let choices = ["Likes"];
        await Server.findOne({ "server.ID": interaction.guild?.id }).then(
            (server) => {
                if (!server) {
                    return;
                }

                if (server.playlists) {
                    server.playlists
                        .map((playlist) => playlist.name)
                        .forEach((name) => {
                            choices.push(name);
                        });
                }
            }
        );
        await User.findOne({ ID: interaction.user.id }).then((user) => {
            if (!user) {
                return;
            }

            if (user.playlists) {
                user.playlists
                    .map((playlist) => playlist.name)
                    .forEach((name) => {
                        choices.push(name);
                    });
            }
        });

        choices = removeDuplicates(choices);
        function removeDuplicates<T>(arr: T[]): T[] {
            return arr.filter((item, index) => arr.indexOf(item) === index);
        }

        const filtered = choices.filter((choice) =>
            choice.startsWith(focusedValue)
        );

        await interaction.respond(
            filtered.map((choice) => ({ name: choice, value: choice }))
        );
    }

    async run(interaction: ChatInputCommandInteraction) {
        const serverID = interaction.guild?.id;
        const userID = interaction.user.id;
        const playlistName = interaction.options.get("playlist")
            ?.value as string;
        const page =
            ((interaction.options.get("page")?.value as number) || 1) - 1;

        if (playlistName == "Likes") {
            const likedTracks =
                (await User.findOne({ ID: userID }).then((user) => {
                    if (!user) {
                        return;
                    }

                    return user.likes;
                })) || [];

            this.playlist = {
                name: "Likes",
                creater: {
                    name: interaction.user.username,
                    ID: interaction.user.id,
                },
                tracks: likedTracks,
            };

            return this.showTracks(interaction, page);
        }

        const server = await Server.findOne({ "server.ID": serverID });

        let serverPL;
        if (server) {
            serverPL = server.playlists.find(
                (playlist) => playlist.name == playlistName
            );
        }

        const user = await User.findOne({ ID: userID });

        let userPL;
        if (user) {
            userPL = user.playlists.find(
                (playlist) => playlist.name == playlistName
            );
        }

        if (serverPL && userPL) {
            const reply = await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00cbb7)
                        .setTitle("Found 2 Playlists!")
                        .setDescription(
                            `There are 2 playlists named \`${serverPL.name}\`!\n\nWould you like to view the server playlist or your personal playlist?`
                        ),
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`showServerPL`)
                            .setLabel(`Server`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`showUserPL`)
                            .setLabel(`Personal`)
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
            });

            return this.handleDuplicateButton(reply, serverPL, userPL, page);
        }

        this.playlist = serverPL || userPL;

        this.showTracks(interaction, page);
    }

    private async handleDuplicateButton(
        reply: Message,
        serverPL: IPlaylist,
        userPL: IPlaylist,
        page: number
    ) {
        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
        });

        collector.on(`collect`, (interaction) => {
            const isServerPL = interaction.customId == `showServerPL`;
            this.playlist = isServerPL ? serverPL : userPL; //set the playlist to the one specifed
            this.showTracks(interaction, page);
            collector.stop();
        });
    }

    private async showTracks(
        interaction: CommandInteraction | ButtonInteraction,
        page: number
    ) {
        if (page < 0) {
            page = 0;
        }

        const buttonInteraction = interaction.isButton();
        const playlist = this.playlist;

        if (!playlist) {
            const noPlaylistEmbed = {
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(`Playlist was not found!`),
                ],
                components: [],
            };

            if (buttonInteraction) {
                return await interaction.update(noPlaylistEmbed);
            } else {
                return await interaction.editReply(noPlaylistEmbed);
            }
        }

        if (playlist.tracks.length == 0) {
            const noTracksEmbed = {
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(`**Playlist is Empty!**`)
                        .setDescription(
                            `add tracks with </playlist-add:1127691531348873226>`
                        ),
                ],
                components: [],
            };
            if (buttonInteraction) {
                return await interaction.update(noTracksEmbed);
            } else {
                return await interaction.editReply(noTracksEmbed);
            }
        }

        let totalPages = Math.ceil(playlist.tracks.length / 10);
        if (totalPages == 0) {
            //set pages to 1 when song playing but no queue
            totalPages = 1;
        }

        if (page > totalPages - 1) {
            page = totalPages - 1;
        }

        const tracksString = playlist.tracks
            .slice(page * 10, page * 10 + 10)
            .map((track, i) => {
                return `**${i + 1}.** \`[${track.duration}]\` [${
                    track.title
                }](${track.url})\n**Added By: <@${track.requestedBy}>**`;
            })
            .join("\n");

        const components = new ActionRowBuilder<ButtonBuilder>();

        if (page != 0) {
            components.addComponents(
                new ButtonBuilder()
                    .setCustomId(`viewPrevPageButton`)
                    .setLabel(`<`)
                    .setStyle(ButtonStyle.Secondary)
            );
        }

        if (page != totalPages - 1) {
            components.addComponents(
                new ButtonBuilder()
                    .setCustomId(`viewNextPageButton`)
                    .setLabel(`>`)
                    .setStyle(ButtonStyle.Secondary)
            );
        }

        const viewPlaylistEmbed = {
            embeds: [
                new EmbedBuilder()
                    .setColor(0xa020f0)
                    .setTitle(`**${playlist.name}**`)
                    .setDescription(tracksString)
                    .setFooter({ text: `Page ${page + 1} of ${totalPages}` }),
            ],
            components:
                components.components.length > 0 ? [components] : undefined, //components[0].componets.length mush not be empty otherwise undefined
        };

        let reply: InteractionResponse | Message | undefined;
        try {
            if (buttonInteraction) {
                reply = await interaction.update(viewPlaylistEmbed);
            } else {
                reply = await interaction.editReply(viewPlaylistEmbed);
            }
        } catch (e) {
            console.error(e);
        }

        if (!reply) {
            return;
        }

        if (components.components.length != 0) {
            const collector = reply.createMessageComponentCollector({
                componentType: ComponentType.Button,
            });

            collector.on(`collect`, (buttonInteraction) => {
                const isPrevPage =
                    buttonInteraction.customId == `viewPrevPageButton`;
                const isNextPage =
                    buttonInteraction.customId == `viewNextPageButton`;

                if (isPrevPage) {
                    this.showTracks(buttonInteraction, page - 1);
                } else if (isNextPage) {
                    this.showTracks(buttonInteraction, page + 1);
                }

                collector.stop();
            });
        }
    }
}
