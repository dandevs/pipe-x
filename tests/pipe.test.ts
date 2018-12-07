import { Pipe } from "../src/pipe";
import { Operator } from "../src/operator";
import { finishStrategies } from "../src/finishStrategy";

describe("Pipe", () => {
    it("Works", (done) => {
        jest.setTimeout(150);

        const add5 = Operator.define((value, observer) =>
            observer.push(value + 5));

        const mul2 = Operator.define((value, observer) =>
            observer.push(value * 2));

        const ender = Operator.define((value, observer) => {
            observer.push(value);
            observer.finish();
        });

        const take = count => Operator.define((value, observer) => {
            if (observer.state.i++ < count)
                observer.push(value);

            if (observer.state.i == count)
                observer.finish();

        }, () => ({i: 0}));

        const delay = Operator.define((value, observer) => {
            setTimeout(() => observer.push(value), Math.random() * 50);
        }, null, null, null, finishStrategies.counter);

        const pipe = Pipe(delay, take(3)); //?
        const pipeInPipe = Pipe(pipe, add5);

        add5().subscribe();

        pipe.subscribe(value => {
            console.log(value);
        }, () => {
            console.log("ended");
            done();
        });

        // pipeInPipe.subscribe(value => {
        //     console.log(value);
        // });

        for (let i = 0; i < 10; i++)
            pipe(Math.random() * 10);
        // pipe(10); //?
        // pipe(10); //?
        // pipeInPipe(20); //?
    });
});