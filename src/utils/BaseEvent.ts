interface BaseEvent {
    name: string;
    once?: boolean;
    execute: (...args: any) => void | Promise<void>;
}
