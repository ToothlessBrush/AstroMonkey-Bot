import BaseCommand from "../../utils/BaseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, EmbedBuilder, Guild } from "discord.js";
import MyClient from "../../utils/MyClient";
import { COLORS } from "../../utils/constants";

export default class extends BaseCommand {
    constructor() {
        super();
    }

    data = new SlashCommandBuilder()
        .setName("status")
        .setDescription("Get the bot status");

    async run(interaction: ChatInputCommandInteraction) {
        const { totalUsers, totalGuilds } = await fetchStatistics(
            interaction.client as MyClient
        );
        const embed = new EmbedBuilder()
            .setColor(COLORS.purple)
            .setTitle("Bot Status")
            .addFields(
                {
                    name: "Total Users",
                    value: totalUsers.toString(),
                    inline: true,
                },
                {
                    name: "Total Guilds",
                    value: totalGuilds.toString(),
                    inline: true,
                }
            );
        await interaction.editReply({ embeds: [embed] });
        return;
    }
}

async function fetchGuilds(client: MyClient): Promise<Map<string, Guild>> {
    const guilds = client.guilds.cache;
    return guilds;
}

function calculateTotalCount(guilds: Map<string, Guild>): {
    totalUsers: number;
    totalGuilds: number;
} {
    let totalUsers = 0;
    guilds.forEach((guild) => {
        totalUsers += guild.memberCount;
    });

    return { totalUsers, totalGuilds: guilds.size };
}

async function fetchStatistics(
    client: MyClient
): Promise<{ totalUsers: number; totalGuilds: number }> {
    const guilds = await fetchGuilds(client);
    const { totalUsers, totalGuilds } = await calculateTotalCount(guilds);

    return { totalUsers, totalGuilds };
}
