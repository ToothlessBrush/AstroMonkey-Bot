import { ActivityType, Events } from "discord.js";
import chalk from "chalk";
import MyClient from "../../utils/MyClient";

const readyEvent: BaseEvent = {
    name: Events.ClientReady,
    once: true,
    execute(client: MyClient) {
        if (!client.user) {
            console.log("client.user is null");
            process.exit(1);
        }
        console.log(chalk.green(`Logged in as ${client.user.tag}`));
        client.user.setActivity({
            name: "/help",
            type: ActivityType.Listening,
        });
    },
};

export default readyEvent;
