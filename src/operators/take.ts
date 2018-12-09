import { OperatorJunction, Operator } from "../operator";

export const take = count => Operator.define((value, observer) => {
    if (observer.state.i++ < count)
        observer.push(value);

    if (observer.state.i >= count)
        observer.finish();
},
() => ({ i : 0}));