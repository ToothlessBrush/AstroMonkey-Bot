import chalk from "chalk"

export default {
    name: "disconnected",
    execute() {
        console.log(chalk.red("[Database Status]: Disconnected"))
    },
}
