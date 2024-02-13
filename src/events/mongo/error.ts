import chalk from "chalk"

export default {
    name: "err",
    execute() {
        console.log(chalk.red(`an error occured with the database connection`))
    },
}
