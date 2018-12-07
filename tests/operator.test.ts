import { Operator } from "../src/operator";

describe("Operator", () => {
    it("Can static #define()", () => {
        const op = Operator.define((value, observer) =>
            observer.push(value));

        expect(op(Operator.unwrap) instanceof Operator).toEqual(true);
    });

    it("Can link multiple operators", () => {
        const identity = Operator.define((value, observer) =>
            observer.push(value))();

        const multiply = Operator.define((value, observer) =>
            observer.push(value * 2))();

        multiply.subscribe(e => expect(e === 200).toBe(true));
        identity.link(null, multiply);
        identity.push(100);
    });
});