import chalk from "chalk"

module.exports = {
    name: "connected",
    execute() {
        console.log(chalk.green("[Database Status]: Connected"))
    },
}