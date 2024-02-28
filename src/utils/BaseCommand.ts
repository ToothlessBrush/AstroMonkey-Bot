import {
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
} from "discord.js";

/**
 * Base class for all slash commands
 * @class BaseCommand
 */
class BaseCommand {
    /**
     * The data for the slash command
     * @type {SlashCommandBuilder | undefined}
     */
    data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | undefined = undefined; //idk why Omit is needed but it is

    /**
     * constructor for BaseCommand
     * @constructor
     */
    constructor(data?: SlashCommandBuilder) {
        this.data = data;
    }

    /**
     *
     * @param interaction interaction object for slash commands
     * @returns void
     */
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        throw new Error("This method has not been implemented");
    }

    /**
     *
     * @param interaction autocomplete interaction object for slash commands
     * @returns void
     */
    async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        throw new Error("This method has not been implemented");
    }

    /**
     *
     * @param interaction button interaction object for slash commands
     * @returns void
     */
    async button(interaction: ButtonInteraction): Promise<void> {
        throw new Error("This method has not been implemented");
    }
}

export default BaseCommand;
