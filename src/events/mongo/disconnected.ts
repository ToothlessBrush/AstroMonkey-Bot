import chalk from "chalk"

const disconnectedEvent: BaseEvent ={
    name: "disconnected",
    execute() {
        console.log(chalk.red("[Database Status]: Disconnected"))
    },
}

export default disconnectedEvent;
