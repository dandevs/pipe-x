import { noop, removeFromArray } from "./utils";
import { Subscribable } from "./subscribable";
import { FinishStrategy, finishStrategies } from "./finishStrategy";

export class Operator<T = any> extends Subscribable {
    totalSubscriptions: number = 0;
    alive:              boolean = true;
    isJunction:         boolean = false;
    isPipe:             boolean = false;
    root:               Operator;
    observer:           Observer;
    handler:            (value?: any, observer?: Operator["observer"]) => any;
    onFinishTrigger:    OperatorTrigger;
    onErrorTrigger:     OperatorTrigger;
    syncValue:          any;
    state:              any;
    finishStrategy:     ReturnType<FinishStrategy>;

    links = { front: <Operator[]>[], back: <Operator>null };

    static define(
        handler?:         Operator["handler"],
        onSetupTrigger?:  OperatorTrigger,
        onFinishTrigger?: OperatorTrigger,
        onErrorTrigger?:  OperatorTrigger,
        finishStrategy?:  FinishStrategy,
    ){
        return (value?) => {
            const operator                 = new Operator();
                  operator.handler         = handler || noop;
                  operator.onFinishTrigger = onFinishTrigger || noop;
                  operator.onErrorTrigger  = onErrorTrigger || noop;
                  operator.finishStrategy  = (finishStrategy || finishStrategies.immediate)();

            operator.observer.state = (onSetupTrigger || noop)(operator.observer, operator);
            return operator;
        };
    }

    constructor() {
        super();
        this.observer = this.createObserver();
    }

    push(value?) {
        if (!this.alive)
            return;

        this.finishStrategy.push();
        this.handler(value, this.observer);
        return this.syncValue;
    }

    link(backOp?: Operator, frontOp?: Operator) {
        if (frontOp) {
            frontOp.root = this.root || this;
            this.links.front.push(frontOp);
        }

        this.links.back = backOp;
        return this;
    }

    pushToLinks(value?) {
        this.links.front.forEach(op => op.push(value));

        if (this.links.front.length == 0)
            this.notifyPush(value);
    }

    finishImmediate() {
        const backLink = this.links.back;
        this.alive = false;
        this.onFinishTrigger(this.observer, this);
        this.notifyFinishOrError(true);

        if (backLink) {
            if (backLink.isJunction)
                removeFromArray(backLink.links.front, this);

            backLink.finishImmediate();
        }

        this.links.front.forEach(frontOp => frontOp.finishUp());
    }

    finishUp() {
        if (this.alive && this.finishStrategy.canFinish)
            this.finishImmediate();

        this.alive = false;
    }

    createObserver() { return {
        push: value => {
            this.syncValue = value;
            this.pushToLinks(value);
            this.finishStrategy.pop();

            if (!this.alive && this.finishStrategy.canFinish)
                this.finishImmediate();
        },

        finish: () => {
            this.finishUp();
        },

        error: noop,
        state: <any>{},
    };}
}

type Observer        = ReturnType<Operator["createObserver"]>;
type OperatorTrigger = (observer: Observer, operator: Operator, error?) => void;

export type OperatorConstructor = {
    (): Operator,
};