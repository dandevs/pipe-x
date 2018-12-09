import { noop, removeFromArray } from "./utils";

export class Subscribable<T = any> {
    subscribers = [];

    subscribe(onValue?, onFinish?, onError?) {
        const sub = [onValue || noop, onFinish || noop, onError || noop];
        this.subscribers.push(sub);
        return () => removeFromArray(this.subscribers, sub);
    }

    notifyOnValue(value?: T) {
        this.subscribers.forEach(sub => sub[0](value));
    }

    notifyOnFinishOrError(finish?: boolean, error?: boolean) {
        this.subscribers.forEach(sub => {
            if (finish) sub[1]();
            if (error) sub[2]();
        });

        this.subscribers = [];
    }
}