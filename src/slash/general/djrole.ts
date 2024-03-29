import { SlashCommandBuilder, EmbedBuilder } from "@discordjs/builders";
import {
    ChatInputCommandInteraction,
    CommandInteraction,
    PermissionFlagsBits,
} from "discord.js";

import BaseCommand from "../../utils/BaseCommand";

export default class djrole extends BaseCommand {
    constructor() {
        super();
    }
    data = new SlashCommandBuilder()
        .setName("djrole")
        .setDescription(
            "set the djrole which restricts certain features of music commands to that role"
        )
        .addRoleOption((option) =>
            option
                .setName("role")
                .setDescription("the role to set the djrole")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.isAutocomplete()) {
            return;
        }

        interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setDescription(`djrole is currently WIP`),
            ],
        });
        return;
    }
}
