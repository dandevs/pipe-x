import { Pipe } from "../src/pipe";
import { Operator, OperatorConstructor } from "../src/operator";
import { finishStrategies } from "../src/finishStrategy";

let add:      (count) => OperatorConstructor;
let multiply: (count) => OperatorConstructor;
let take:     (count) => OperatorConstructor;
let delay:    OperatorConstructor;

describe("Pipe", () => {
    beforeAll(() => {
        add = (count) =>
            Operator.define((value, observer) => observer.push(value + count));

        multiply = (count) =>
            Operator.define((value, observer) => observer.push(value * count));

        take = count => Operator.define((value, observer) => {
            if (observer.state.i++ < count)
                observer.push(value);

            if (observer.state.i == count)
                observer.finish();

        }, () => ({i: 0}));

        delay = Operator.define((value, observer) => {
            setTimeout(() => observer.push(value), Math.random() * 50);
        }, finishStrategies.counter);
    });

    it("Syncronhous returns", () => {
        const pipe = Pipe(add(2), add(7), multiply(2));
        expect(pipe(1) == 20).toBe(true);
    });

    it("Pipe in pipe", () => {
        const p0 = Pipe(add(1));
        const p1 = Pipe(add(1), multiply(5));
        const p2 = Pipe(add(1), p0, p1);

        // p2(0); //?
        // expect(p2(5) == 100).toBe(true);
    });

    describe("Pipe.pipe", () => {
        it("Soft links", () => {
            const p0 = Pipe(add(5));
            const p1 = p0.pipe(multiply(2));

            expect(p0(5) === 10).toEqual(true);
            expect(p1(5) === 20).toEqual(true);
        });

        it("Hard links", () => {
            const base = Pipe(add(5));
            const soft = base.pipe(true, add(20), take(1));
            const hard = base.pipe(true, multiply(5), take(2));
            // base.pipe(add(0), take(1));

            base.subscribe(null, e => {
                console.log(e);
            });

            soft.subscribe(null, () => {
                console.log("done");
            });

            soft(5); //?
            hard(5);
            hard(5);
            // hard(5); //?
            // expect(soft(5) == 30).toEqual(true);
            // expect(hard(5) === 50).toEqual(true);
        });
    });
});