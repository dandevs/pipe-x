import { noop } from "./utils";

const immediateStrategy: FinishStrategy = () => ({
    push: noop, pop: noop, canFinish: true,
});

const counterStrategy: FinishStrategy<{counter: number}> = () => ({
    counter: 0,
    get canFinish() { return this.counter <= 0; },
    push() { this.counter++; },
    pop() { this.counter--; },
});

const delayStrategy: FinishStrategy = () => ({
    canFinish: true,
    push() { this.canFinish = false; },
    pop() { this.canFinish = true; },
});

export const finishStrategies = {
    immediate: immediateStrategy,
    counter:   counterStrategy,
};

export interface FinishStrategy<T = {}> {
    (): {
        push(): any,
        pop(): any,
        canFinish: boolean,
    } & T;
}