import { OperatorConstructor, Operator } from "./operator";

export function Pipe(...operatorFns: (PipeType|OperatorConstructor)[]) {
    let operators: Operator[] = [];

    operatorFns.forEach((opFn: any) => {
        if (!opFn.isPipe)
            operators.push(opFn());
        else
            opFn.operatorFns.forEach(subOpFn => operators.push(subOpFn()));
    });

    operators.forEach((operator, i) => {
        const front = i < operators.length? operators[i + 1] : null;
        const back = i > 0 ? operators[i - 1] : null;
        operator.link(back, front);
    });

    const firstOp = operators[0],
          lastOp  = operators[operators.length - 1];

    lastOp.isJunction = true;

    // ----------------------------------------------

    const pipeFn: PipeType = (value?) => {
        firstOp.push(value);
        return lastOp.syncValue;
    };

    pipeFn.operatorFns = operatorFns;
    pipeFn.isPipe      = true;
    pipeFn.subscribe   = lastOp.subscribe.bind(lastOp);

    return pipeFn as PipeType;
}

type PipeType<T = any> = {
    (value?: T): any;
    operatorFns: OperatorConstructor[];
    isPipe:      boolean;
    subscribe:   Operator["subscribe"];
};