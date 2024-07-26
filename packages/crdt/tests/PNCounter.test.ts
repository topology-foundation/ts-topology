import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { PNCounter } from "../src/builtins/PNCounter";
import { GCounter } from "../src/builtins/GCounter";

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