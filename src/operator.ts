import { removeFromArray, noop } from "./utils";
import { Subscribable } from "./subscribable";

export class Operator<T = any, S = any> extends Subscribable<T> {
    links = { back: <Operator>null, front: <Operator[]>[] };
    alive = true;
    observer: Observer<T, S>;
    syncValue: T;
    lock: boolean;

    static none = Symbol("none");

    static define<T = any, S = any>(operation?: Operation<T, S>, setupFn?: OperatorSetupFn<T, S>, finishStrategy?) {
        let opCache: Operator<T>;

        const opPackage = (value?: T) => {
            if (!opCache) opCache = opPackage.asJunction();
            return opCache.push(value);
        };

        opPackage.asNormal   = () => new Operator(operation, setupFn, finishStrategy);
        opPackage.asJunction = () => new OperatorJunction(operation, setupFn, finishStrategy);

        return opPackage;
    }

    constructor(
        public operation?: Operation<T, S>,
        setupFn?: OperatorSetupFn<T, S>,
        public finishStrategy?,
    ){
        super();
        this.observer = this.createObserver();
        this.observer.state = (setupFn || noop)(this, this.observer);
    }

    push(value?: T) {
        if (!this.alive) return;
        // @ts-ignore
        this.syncValue = Operator.none;
        this.operation(value, this.observer);
        return this.syncValue;
    }

    pushToFront(value?: T) {
        this.links.front.forEach(op => this.syncValue = op.push(value));
    }

    // -------------------------------------------------------------------

    finishImmediate(fromOperator?: Operator) {
        if (this.links.back && this.alive)
            this.links.back.finishImmediate(this);

        this.alive = false;
    }

    finishUp() { // TODO: Add finish up strategy
        this.links.front.forEach(op => op.finishUp());
        this.finishImmediate();
    }

    // -------------------------------------------------------------------

    createObserver() { return {
        push: (value?: T) => {
            this.syncValue = value;
            this.pushToFront(value);
        },

        finish: this.finishUp.bind(this),
        error:  noop,
        state:  <S>{},
    };}
}

// --------------------------------------------------------------------

export class OperatorJunction<T = any, S = any> extends Operator<T, S> {
    isHardLinked = false;
    pipeStartOperator: Operator;

    registerInPipe() {
        // console.log(this.pipeStartOperator.links);
    }

    pushToFront(value?: T) {
        this.notifyOnValue(value);
        this.links.front.forEach(op => op.push(value));
    }

    finishImmediate(fromOperator?: Operator) {
        if (!this.isHardLinked) {
            return this.notifyOnFinishOrError(true);
        }

        removeFromArray(this.links.front, fromOperator);

        if (this.links.front.length == 0) {
            super.finishImmediate();
            this.notifyOnFinishOrError(true);
        }
    }
}

// ------------------------------------------------------------

export class OperatorPipe<T = any, S = any> extends Operator<T, S> {

}

// ------------------------------------------------------------

export function linkOperators(target: Operator, back?: Operator, front?: Operator) {
    if (back) target.links.back = back;
    if (front) target.links.front.push(front);
}

// ------------------------------------------------------------

export type Observer<T, S = any> = ReturnType<Operator<T, S>["createObserver"]>;
export type Operation<T, S = any> = (value: T, observer: Observer<T, S>) => any;
export type OperatorSetupFn<T, S = any> = (operator: Operator<T, S>, observer: Observer<T, S>) => S;
export type OperatorPackage = ReturnType<typeof Operator["define"]>;