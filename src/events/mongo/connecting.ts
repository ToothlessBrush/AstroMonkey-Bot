import chalk from "chalk";

const connectingEvent: BaseEvent = {
    name: "connecting",
    execute() {
        console.log(chalk.cyan("[Database Status]: Connecting..."));
    },
};

export default connectingEvent;
