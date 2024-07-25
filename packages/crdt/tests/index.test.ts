import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { LWWElementSet, Bias } from "../src/builtins/LWWElementSet";
import { GSet } from "../src/builtins/GSet";
import { GCounter } from "../src/builtins/GCounter";
import { PNCounter } from "../src/builtins/PNCounter";
import { TwoPSet } from "../src/builtins/2PSet";
import { ORSet, ElementTuple } from "../src/builtins/ORSet";

const testValues = ["walter", "jesse", "mike"];

describe("G-Counter Tests", () => {

    let set1: GCounter;
    let set2: GCounter; 

    beforeEach(() => {
        set1 = new GCounter({ 0: 5, 1: 10, 2: 15 });
        set2 = new GCounter({ 0: 5, 1: 10, 2: 15 });
    });

    test("Test Initial Values", () => {
        expect(set1.value()).toBe(30);
        expect(set2.value()).toBe(30);
    });

    test("Test Increment", () => {

        set1.increment(0, 10);
        set1.increment(1, 5);

        set2.increment(0, 10);
        set2.increment(2, 5);

        expect(set1.value()).toBe(45);
        expect(set2.value()).toBe(45);
    });

    test("Test Compare", () => {

        expect(set1.compare(set2)).toBe(true);
        
        set1.increment(0, 5);

        expect(set1.compare(set2)).toBe(false);

        let set3 = new GCounter({ 0: 5, 1: 10, 3: 15 });

        expect(set1.compare(set3)).toBe(false);
    });

    test("Test Merge", () => {

        set1.increment(0, 5);
        set2.increment(1, 10);
        expect(set1.value()).toBe(35);
        expect(set2.value()).toBe(40);
        set1.merge(set2);
        expect(set1.value()).toBe(45);
        expect(set1.counts[0]).toBe(10);
        expect(set1.counts[1]).toBe(20);
        expect(set1.counts[2]).toBe(15);

        set2.merge(set1);
        expect(set2.value()).toBe(45);
        expect(set2.counts[0]).toBe(10);
        expect(set2.counts[1]).toBe(20);
        expect(set2.counts[2]).toBe(15);

        expect(set2.compare(set1)).toBe(true);
    });

});

describe("PN-Counter Tests", () => {

    let set1: PNCounter;
    let set2: PNCounter;

    beforeEach(() => {
        set1 = new PNCounter(new GCounter({ 0: 5, 1: 10, 2: 15 }), new GCounter({ 0: 3, 1: 4, 2: 3 }));
        set2 = new PNCounter(new GCounter({ 0: 5, 1: 10, 2: 15 }), new GCounter({ 0: 3, 1: 4, 2: 3 }));
    });

    test("Test Initial Value", () => {
        expect(set1.value()).toBe(20);
        expect(set2.value()).toBe(20);
    });

    test("Test Increment", () => {
        set1.increment(0,10);
        set2.increment(0,20);
        expect(set1.value()).toBe(30);
        expect(set2.value()).toBe(40);
    });

    test("Test Decrement", () => {
        set1.decrement(0,10);
        set2.decrement(0,20);
        expect(set1.value()).toBe(10);
        expect(set2.value()).toBe(0);
    });

    test("Test Compare", () => {
        expect(set1.compare(set2)).toBe(true);

        set1.decrement(0,10);

        expect(set1.compare(set2)).toBe(false);

        set2.decrement(0,10);

        expect(set1.compare(set2)).toBe(true);
    });

    test("Test Merge", () => {
        set1.increment(0,10);
        set2.decrement(1,5);

        expect(set1.compare(set2)).toBe(false);
        expect(set2.compare(set1)).toBe(false); 

        set1.merge(set2);
        set2.merge(set1);

        expect(set1.compare(set2)).toBe(true);
        expect(set2.compare(set1)).toBe(true);        
    });

});

describe("G-Set Tests", () => {

    let set1: GSet<string>;
    let set2: GSet<string>;

    beforeEach(() => {
        set1 = new GSet<string>(new Set<string>(["walter", "jesse", "mike"]));
        set2 = new GSet<string>(new Set<string>(["walter", "jesse", "mike"]));
    });

    test("Test Add", () => {
        set1.add("gustavo");
        set2.add("gustavo");

        expect(set1.lookup("gustavo")).toBe(true);
        expect(set2.lookup("gustavo")).toBe(true);
    });

    test("Test Compare", () => {
        expect(set1.compare(set2)).toBe(true);

        set1.add("gustavo");

        expect(set1.compare(set2)).toBe(false);

        set2.add("gustavo");

        expect(set1.compare(set2)).toBe(true);
    });

    test("Test Merge", () => {
        set1.add("gustavo");
        set2.add("lalo");

        expect(set1.compare(set2)).toBe(false);

        set1.merge(set2);
        set2.merge(set1);

        expect(set1.compare(set2)).toBe(true);
       
    });

    

});

describe("2P-Set Tests", () => {

    let set1: TwoPSet<string>;
    let set2: TwoPSet<string>;

    beforeEach(() => {
        set1 = new TwoPSet<string>(new GSet<string>(new Set<string>(["walter", "jesse", "mike"])), new GSet<string>(new Set<string>()));
        set2 = new TwoPSet<string>(new GSet<string>(new Set<string>(["walter", "jesse", "mike"])), new GSet<string>(new Set<string>()));
    });

    test("Test Add Element", () => {
        expect(set1.lookup("gustavo")).toBe(false);

        set1.add("gustavo");

        expect(set1.lookup("gustavo")).toBe(true);
    });

    test("Test Remove Element", () => {
        expect(set1.lookup("mike")).toBe(true);
        
        set1.remove("mike");

        expect(set1.lookup("mike")).toBe(false);
    });

    test("Test Compare Elements", () => {
        expect(set1.compare(set2)).toBe(true);

        set1.remove("mike");

        expect(set1.compare(set2)).toBe(false);

        set2.remove("mike");

        expect(set1.compare(set2)).toBe(true); 
    });

    test("Test Merge Elements", () => {
        set1.remove("mike");
        set2.add("gustavo");
        
        expect(set1.compare(set2)).toBe(false);

        set1.merge(set2);
        set2.merge(set1);

        expect(set1.compare(set2)).toBe(true);
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

    test("Test Add Elements", () => {

        // Check if the sets contain the elements
        testValues.forEach((value) => {
            sets.forEach((set) => {
                expect(set.lookup(value), 'Set must contain ${value}').toBe(true);
            });
        });

    });

    test("Test Remove Elements", () => {

        //remove saul from the sets
        set1.remove("saul", Date.now());
        set2.remove("saul", Date.now());
        set3.remove("saul", Date.now());

        sets.forEach((set) => {
            expect(set.lookup("saul")).toBe(false);
        });
    });

    test("Test Compare Sets", () => {

        expect(set1.compare(set2)).toBe(true);
        expect(set1.compare(set3)).toBe(true);
        expect(set3.compare(set2)).toBe(true);

        set1.remove("jesse", Date.now());

        expect(set1.compare(set2)).toBe(false);
        expect(set1.compare(set3)).toBe(false);
        expect(set3.compare(set2)).toBe(true);

    });

    describe("Test Merge Elements" , () => {

        test("Merge Sets", () => {

            // Adding different names to each set
            set1.add("gustavo", Date.now());
            set2.add("saul", Date.now());
    
            expect(set1.compare(set2)).toBe(false);
    
            set1.merge(set2);
            set2.merge(set1);
    
            expect(set1.compare(set2)).toBe(true);
    
        });

        test("Same Element, different Timestamps", () => {

            const timestamp = Date.now();
            set1.add("gustavo", timestamp);
            set2.add("gustavo", timestamp + 5);
    
            expect(set1.getAdds().get("gustavo")).toBe(timestamp);
    
            set1.merge(set2);
            set2.merge(set1);
    
            expect(set1.getAdds().get("gustavo")).toBe(timestamp + 5);
            expect(set2.getAdds().get("gustavo")).toBe(timestamp + 5);
    
        });

        test("Merge Removal Timestamps", () => {

            const timestamp = Date.now();

            set1.add("gustavo", timestamp);
            set1.remove("gustavo", timestamp + 5);

            set1.merge(set2);
            
    
            expect(set1.lookup("gustavo")).toBe(false);
            expect(set1.getRemoves().get("gustavo")).toBe(timestamp + 5);
    
        });
    });
});

describe("OR-Set Tests", () => {

    let set1: ORSet<string>;
    let set2: ORSet<string>;

    beforeEach(() => {
        set1 = new ORSet<string>(new Set<ElementTuple<string>>(), "set1");
        set2 = new ORSet<string>(new Set<ElementTuple<string>>(), "set2");

        testValues.forEach((value) => {
            set1.add(value);
            set2.add(value);
        });
    });

    test("Test Add Elements", () => {
        expect(set1.lookup("gustavo")).toBe(false);

        set1.add("gustavo");

        expect(set1.lookup("gustavo")).toBe(true);
    });

    test("Test Remove Elements", () => {
        expect(set1.lookup("mike")).toBe(true);

        set1.remove("mike");

        expect(set1.lookup("mike")).toBe(false);
    });

    test("Test Compare & Merge Elements", () => {
        expect(set1.compare(set2)).toBe(false);

        set1.merge(set2);
        set2.merge(set1);

        expect(set1.compare(set2)).toBe(true);        
    });

});