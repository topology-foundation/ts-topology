import { describe, test, expect, beforeEach } from "vitest";
import { GCounter } from "../src/builtins/GCounter";

describe("G-Counter Tests", () => {
    let set1: GCounter;
    let set2: GCounter; 

    beforeEach(() => {
        set1 = new GCounter({ "node1": 5, "node2": 10});
        set2 = new GCounter({ "node1": 5, "node2": 10});
    });

    test("Test Initial Values", () => {
        expect(set1.value()).toBe(15);
        expect(set2.value()).toBe(15);
    });

    test("Test Increment", () => {
        set1.increment("node1", 10);
        set1.increment("node2", 5);

        expect(set1.value()).toBe(30);
    });

    test("Test Compare", () => {
        expect(set1.compare(set2)).toBe(true);
        
        set2.increment("node1", 5);

        expect(set1.compare(set2)).toBe(false);

        let set3 = new GCounter({ "node1": 5, "node2": 10, "node3": 15 });

        expect(set1.compare(set3)).toBe(false);
    });

    test("Test Merge", () => {
        const counter1 = new GCounter({ "node1": 5 });
        const counter2 = new GCounter({ "node2": 10 });
    
        counter1.merge(counter2);
    
        expect(counter1.counts).toEqual({ "node1": 5, "node2": 10 });
        expect(counter1.value()).toBe(15);

        set1.increment("node1", 5);
        set2.increment("node2", 10);
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