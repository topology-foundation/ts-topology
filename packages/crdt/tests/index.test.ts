import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { LWWElementSet } from "../src/builtins/LWWElementSet";
import { GSet } from "../src/builtins/GSet";


// Bias for LWW-Element-Set
enum Bias {
    ADD,
    REMOVE
}

const testValues = ["walter", "jesse", "mike"];

describe("G-Counter Tests", () => {

    test("mock", () => {

    });

});

describe("PN-Counter Tests", () => {

    test("Add Elements", () => {

    });

});

describe("G-Set Tests", () => {

    // let set1 = new GSet<string>(new Set());
    // let set2 = new GSet<string>(new Set());

    // const sets = [set1, set2];

    // beforeEach(() => {
    //     testValues.forEach((value) => {
    //         sets.forEach((set) => {
    //             set.add(value);
    //         });
    //     });
    // });

    // test("Compare elements", () => {
    //     expect(set1.compare(set2)).toBe(true);
    // });

    test("mock", () => {

    });

});

describe("2P-Set Tests", () => {

    test("mock", () => {

    });

});

describe("LWW-Element-Set Tests", () => {

    let set1 = new LWWElementSet<string>(new Map(), new Map(), Bias.ADD);
    let set2 = new LWWElementSet<string>(new Map(), new Map(), Bias.ADD);
    let set3 = new LWWElementSet<string>(new Map(), new Map(), Bias.REMOVE);

    const sets = [set1, set2, set3];

    beforeEach(() => {
        testValues.forEach((value) => {
            sets.forEach((set) => {
                set.add(value, Date.now());
            });
        });
    });

    afterEach(() => {
        sets.forEach((set) => {
            set.getAdds().clear();
            set.getRemoves().clear();
        });
    });

    test("Add Elements", () => {

        // Check if the sets contain the elements
        testValues.forEach((value) => {
            sets.forEach((set) => {
                expect(set.lookup(value), 'Set must contain ${value}').toBe(true);
            });
        });
        
    });

    test("Remove Elements", () => {

        //remove saul from the sets
        set1.remove("saul", Date.now());
        set2.remove("saul", Date.now());
        set3.remove("saul", Date.now());

        sets.forEach((set) => {
            expect(set.lookup("saul")).toBe(false);
        });
    });

    test("Compare Sets", () => {

        expect(set1.compare(set2)).toBe(true);
        expect(set1.compare(set3)).toBe(true);
        expect(set3.compare(set2)).toBe(true);

        set1.remove("jesse", Date.now());

        expect(set1.compare(set2)).toBe(false);
        expect(set1.compare(set3)).toBe(false);
        expect(set3.compare(set2)).toBe(true);

    });

    test("Merge Sets", () => {

        // Adding different names to each set
        set1.add("gustavo", Date.now());
        set2.add("saul", Date.now());

        expect(set1.compare(set2)).toBe(false);

        set1.merge(set2);
        set2.merge(set1);

        expect(set1.compare(set2)).toBe(true);

    });

    test("Merge Sets w/same Timestamps", () => {

        // Adding different names to each set
        set1.add("gustavo", Date.now());
        set2.add("saul", Date.now());

        expect(set1.compare(set2)).toBe(false);

        set1.merge(set2);
        set2.merge(set1);

        expect(set1.compare(set2)).toBe(true);

    });

});

describe("OR-Set Tests", () => {

    test("mock", () => {

    });

});

