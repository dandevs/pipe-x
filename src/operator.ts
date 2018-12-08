import { noop, removeFromArray } from "./utils";
import { Subscribable } from "./subscribable";
import { FinishStrategy, finishStrategies } from "./finishStrategy";

export class Operator<T = any> extends Subscribable {
    // #region declarations
    totalSubscriptions: number = 0;
    alive:              boolean = true;
    isJunction:         boolean = false;
    isPipe:             boolean = false;
    isHardLinked:         boolean;
    root:               Operator;
    observer:           Observer;
    handler:            (value?: any, observer?: Operator["observer"]) => any;
    onFinishTrigger:    OperatorTrigger;
    onErrorTrigger:     OperatorTrigger;
    syncValue:          any;
    state:              any;
    finishStrategy:     ReturnType<FinishStrategy>;

    links = { front: <Operator[]>[], back: <Operator>null };
    // #endregion

    static define(
        handler?:         Operator["handler"],
        onSetupTrigger?:  OperatorTrigger,
        finishStrategy?:  FinishStrategy,
    ){
        return (value?) => {
            const operator                 = new Operator();
                  operator.handler         = handler || noop;
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

    // --------------------------------------------------------

    link(backOp: Operator, frontOp: Operator) {
        if (frontOp) this.linkFront(frontOp);
        this.linkBack(backOp);
        return this;
    }

    linkFront(frontOp: Operator) {
        frontOp.root = this.root || this;
        this.links.front.push(frontOp);
    }

    linkBack(backOp: Operator) { this.links.back = backOp; }

    // --------------------------------------------------------

    pushToLinks(value?) {
        if (this.links.front.length == 0)
            this.notifyPush(value);
        else
            this.links.front.forEach(op => op.push(value));
    }

    finishImmediate() {
        if (!this.alive)
            return;

        const backLink = this.links.back;
        this.alive = false;
        this.notifyFinishOrError(true);

        if (backLink) {
            if (backLink.isJunction) {
                console.log(backLink.links.front.length);
                removeFromArray(backLink.links.front, this); //?
            }

            if (backLink.isHardLinked) {
                if (backLink.links.front.length == 0)
                    backLink.finishImmediate();
            }
            else
                backLink.finishImmediate();
        }

        this.links.front.forEach(frontOp => frontOp.finishUp());
    }

    finishUp() {
        // if (this.isHardLinked && this.links.front.length > 0)
        //     return;

        if (this.alive && this.finishStrategy.canFinish)
            this.finishImmediate();

        this.alive = false;
    }

    // --------------------------------------------------------

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