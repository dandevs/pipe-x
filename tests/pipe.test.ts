import { Pipe } from "../src/pipe";
import { Operator, linkOperators } from "../src/operator";
import { take } from "../src/operators/take";

const add = n => Operator.define<number>((value, observer) => {
    observer.push(value + n);
});

it("Works", (done) => {
    const p0 = Pipe(add(5), add(10), add(30));
    const p1 = p0.pipe(take(2), add(100));

    p1.subscribe(e => {
        expect(e).toBeTruthy();
    }, () => {
        done();
    });

    p0.subscribe(null, () => {
        throw new Error("This should not finish");
    });

    expect(p0(5) == 50).toBeTruthy();
    expect(p1(5) == 150).toBeTruthy();

    expect(typeof p0(5) == "number").toBeTruthy();
    expect(p1(5) == Operator.none).toBeTruthy();
});

it("Pipes in pipe", () => {
    const p0 = Pipe(add(1));
    const p1 = Pipe(add(2));
    const p3 = Pipe(p0, p1);

    expect(p3(1) == 4).toBeTruthy();
});

it("Branching pipe / hardlink", () => {
    const p0 = Pipe(add(1));
    const p1 = p0.pipe(add(2), take(2));
    const p3 = p1.pipe(add(2), take(3));

    p0.subscribe(e => {
        console.log(e);
    });

    p3(1);
});