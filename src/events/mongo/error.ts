import chalk from "chalk";

const errEvent: BaseEvent = {
    name: "err",
    execute() {
        console.log(chalk.red(`an error occured with the database connection`));
    },
};

export default errEvent;
