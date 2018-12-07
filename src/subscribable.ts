import { noop, removeFromArray } from "./utils";

export class Subscribable {
    subscribers = [];

    subscribe(onPush?, onFinish?, onError?) {
        const sub = [onPush || noop, onFinish || noop, onError || noop];
        this.subscribers.push(sub);
        return () => removeFromArray(this.subscribers, sub);
    }

    notifyFinishOrError(finish?, error?) {
        this.subscribers.forEach(sub => {
            if (finish) sub[1]();
            if (error) sub[2]();
        });

        this.clear();
    }

    notifyPush(value?) {
        this.subscribers.forEach(sub => sub[0](value));
    }

    clear() { this.subscribers = []; }
}

export const enum SubscribeType {
    PUSH, FINISH, ERROR,
}