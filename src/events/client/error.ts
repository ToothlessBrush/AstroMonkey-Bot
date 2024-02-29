import { Events } from "discord.js";

const errorEvent: BaseEvent = {
    name: Events.Error,
    execute(error: Error) {
        console.error(error);
    },
};

export default errorEvent;
