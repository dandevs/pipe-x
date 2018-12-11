import { OperatorPackage, Operator, OperatorJunction, linkOperators } from "./operator";

export function Pipe<T = any>(...operatorPackages: (OperatorPackage | PipeType)[]) {
    const operators = unpackOpPackages(...operatorPackages);

    operators.forEach((op, i) => {
        const back = i > 0 ? operators[i - 1] : null;
        const front = i < operators.length - 1 ? operators[i + 1] : null;
        linkOperators(op, back, front);
    });

    // (<OperatorJunction>operators[operators.length - 1]).registerInPipe();

    const pipe: PipeType<T> = (value?) => {
        // @ts-ignore
        pipe.lastOp.syncValue = Operator.none;
        pipe.rootOp.push(value);
        return pipe.lastOp.syncValue;
    };

    pipe.firstOp    = operators[0];
    pipe.lastOp     = operators[operators.length - 1] as OperatorJunction<any>;
    pipe.rootOp     = pipe.firstOp;
    pipe.subscribe  = pipe.lastOp.subscribe.bind(pipe.lastOp) as Operator["subscribe"];
    pipe.isPipe     = true;
    pipe.opPackages = operatorPackages;

    pipe.pipe = (...childOpPackages) => {
        if (childOpPackages[0] == true) {
            pipe.lastOp.isHardLinked = true;
            childOpPackages.splice(0, 1);
        }

        const childPipe = Pipe(...childOpPackages as OperatorPackage[]);
        linkOperators(pipe.lastOp, null, childPipe.firstOp);
        // linkOperators(childPipe.firstOp, pipe.lastOp);
        childPipe.rootOp = pipe.rootOp;
        return childPipe;
    };

    return pipe;
}

// Utils ---------------------------------------------------

function unpackOpPackages(...operatorPackages: (OperatorPackage | PipeType)[]) {
    const operators: Operator[] = [];

    for (let i = 0; i < operatorPackages.length; i++) {
        let opPackage: (PipeType & OperatorPackage) = operatorPackages[i] as any;

        if (opPackage.isPipe) {
            (opPackage as any as PipeType).opPackages.forEach((opPackage: OperatorPackage) => {
                if (i < operatorPackages.length - 1)
                    operators.push(opPackage.asNormal());
                else
                    operators.push(opPackage.asJunction());
            });
        }
        else {
            if (i < operatorPackages.length - 1)
                operators.push(opPackage.asNormal());
            else
                operators.push((opPackage as OperatorPackage).asJunction());
        }
    }

    // (<OperatorJunction>operators[operators.length - 1]).pipeStartOperator = operators[0];
    return operators;
}

type PipeType<T = any> = {
    (value?: T): T,

    firstOp:    Operator<T>,
    lastOp:     OperatorJunction<T>,
    rootOp:     Operator<T>,
    subscribe:  Operator<T>["subscribe"],
    isPipe:     boolean,
    opPackages: (OperatorPackage | PipeType | boolean)[],

    pipe<T = any>(...opPackages: (PipeType["opPackages"])): PipeType<T>,
};