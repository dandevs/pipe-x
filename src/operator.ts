import { removeFromArray, noop } from "./utils";
import { Subscribable } from "./subscribable";

export class Operator<T = any, S = {}> extends Subscribable<T> {
    links = { back: <Operator>null, front: <Operator[]>[] };
    alive = true;
    observer: Observer<T, S>;

    static asJunction = Symbol();
    static asNormal   = Symbol();
    static none       = Symbol();

    static define<T = any, S = any>(operation?: Operation<T, S>, setupFn?: OperatorSetupFn<T, S>, finishStrategy?) {
        const opConstructor = (value?: T | Symbol) => {
            // TODO: Otherwise calculate the value of the operator
        };

        opConstructor.asNormal = () => new Operator(operation, setupFn, finishStrategy);
        opConstructor.asJunction = () => new Operator(operation, setupFn, finishStrategy);

        return opConstructor;
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
        this.operation(value, this.observer);
    }

    pushToFront(value?: T) {
        this.links.front.forEach(op => op.push(value));
    }

    // -------------------------------------------------------------------

    finishImmediate(fromOperator?: Operator) {
        if (this.links.back && this.alive)
            this.links.back.finishImmediate(this);

        this.alive = false;
    }

    finishUp() {
        this.links.front.forEach(op => op.finishUp());
        this.finishImmediate();
    }

    // -------------------------------------------------------------------

    createObserver() { return {
        push: (value?: T) => {
            this.pushToFront(value);
        },

        finish: this.finishUp.bind(this),
        error:  noop,
        state:  <S>{},
    };}
}

// --------------------------------------------------------------------

export class OperatorJunction<T, S> extends Operator<T, S> {
    isHardLinked = false;

    pushToFront(value?: T) {
        this.notifyOnValue(value);
        super.pushToFront(value);
    }

    finishImmediate(fromOperator?: Operator) {
        if (!this.isHardLinked) {
            super.finishImmediate();
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

export function linkOperators(target: Operator, back?: Operator, front?: Operator) {
    target.links.back = back;
    if (front) target.links.front.push(front);
}

// ------------------------------------------------------------

export type Observer<T, S = {}> = ReturnType<Operator<T, S>["createObserver"]>;
export type Operation<T, S = {}> = (value: T, observer: Observer<T, S>) => any;
export type OperatorSetupFn<T, S = {}> = (operator: Operator<T, S>, observer: Observer<T, S>) => S;