import { Operator, linkOperators, OperatorJunction } from "../src/operator";

describe("Operators", () => {
    it("Works", () => {
        const a = new Operator();
        const b = new Operator();
        const c = new OperatorJunction();
        const d = new OperatorJunction();

        linkOperators(a, null, b);
        linkOperators(b, a, c);
        linkOperators(c, b, null);
        linkOperators(d, c, null);
    });

    it("Can be subscribed to", (done) => {
        jest.setTimeout(0);

        const identity = new OperatorJunction<number, any>((value, observer) => {
            observer.push(value * 2);
            observer.finish();
        });

        identity.subscribe((value) => {
            expect(value == 10).toEqual(true);
        }, () => {
            done();
        });

        identity.push(5);
    });

    it("Can be stateful", () => {
        const take = new Operator((value, observer) => {
            observer.push(1);
        }, () => ({ i: 0 }));
    });
});