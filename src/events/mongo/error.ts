const chalk = require("chalk")

module.exports = {
    name: "err",
    execute() {
        console.log(
            chalk.red(`an error occured with the database connection:\n${err}`)
        )
    },
}
