import { OperatorConstructor, Operator } from "./operator";

export function Pipe(...operatorFns: (PipeType|OperatorConstructor)[]) {
    let operators = unwrapOperatorConstructors(operatorFns);

    operators.forEach((operator, i) => {
        const front = i < operators.length ? operators[i + 1] : null;
        const back = i > 0 ? operators[i - 1] : null;
        operator.link(back, front);
    });

    const firstOp = operators[0],
          lastOp  = operators[operators.length - 1];

    lastOp.isJunction = true;

    // ----------------------------------------------
    let trueRootOp = firstOp;

    const pipeFn: PipeType = (value?) => {
        trueRootOp.push(value);
        return lastOp.syncValue;
    };

    pipeFn.setRoot = (rootOp: Operator) => {
        trueRootOp = rootOp;
    };

    pipeFn.pipe = (...childOpsFn): PipeType => {
        if (typeof childOpsFn[0] == "boolean" && childOpsFn[0]) {
            lastOp.isHardLinked = true;
            childOpsFn.splice(0, 1);
        }

        const childPipe = Pipe(...childOpsFn as any);

        if (lastOp.isHardLinked)
            childPipe.operators[0].linkBack(lastOp);

        lastOp.linkFront(childPipe.operators[0]);
        childPipe.setRoot(trueRootOp);

        return childPipe;
    };

    pipeFn.operatorFns = operatorFns;
    pipeFn.operators   = operators;
    pipeFn.isPipe      = true;
    pipeFn.subscribe   = lastOp.subscribe.bind(lastOp);

    return pipeFn as PipeType;
}

function unwrapOperatorConstructors(operatorFns: (PipeType|OperatorConstructor)[]) {
    let operators: Operator[] = [];

    operatorFns.forEach((opFn: any) => {
        if (!opFn.isPipe)
            operators.push(opFn());
        else
            opFn.operatorFns.forEach(subOpFn => operators.push(subOpFn()));
    });

   return operators;
}

type PipeType<T = any> = {
    (value?: T): any;
    operatorFns: OperatorConstructor[];
    operators:   Operator[];
    isPipe:      boolean;
    subscribe:   Operator["subscribe"];

    setRoot(rootOp: Operator): void;
    pipe(...operatorFns: (OperatorConstructor|boolean)[]): PipeType;
};