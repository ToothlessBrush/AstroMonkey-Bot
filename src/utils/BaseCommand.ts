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
    data:
        | SlashCommandBuilder
        | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> //idk why Omit is needed but it is
        | undefined = undefined;

    /**
     * constructor for BaseCommand
     * @constructor
     */
    constructor(data?: SlashCommandBuilder) {
        this.data = data;
    }

    /**
     * default run handler
     *
     * @param interaction interaction object for slash commands
     * @returns void
     */
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        console.error("This method has not been implemented");
    }

    /**
     *  default autocomplete handler
     *
     * @param interaction autocomplete interaction object for autocomplete commands
     * @returns void
     */
    async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        console.error("This method has not been implemented");
    }

    /**
     * default button handler
     *
     * @param interaction button interaction object for button commands
     * @returns void
     */
    async button(interaction: ButtonInteraction): Promise<void> {
        console.error("This method has not been implemented");
    }
}

export default BaseCommand;
