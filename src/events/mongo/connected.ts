import chalk from "chalk";

const connnectedEvent: BaseEvent = {
    name: "connected",
    execute() {
        console.log(chalk.green("[Database Status]: Connected"));
    },
};

export default connnectedEvent;
