import { describe, test, expect, beforeEach } from "vitest";
import { GCounter } from "../src/crdts/GCounter/index.js";

describe("G-Counter Tests", () => {
    let set1: GCounter;

    beforeEach(() => {
        set1 = new GCounter({ "node1": 5, "node2": 10});
    });

    test("Test Initial Values", () => {
        expect(set1.value()).toBe(15);
    });

    test("Test Increment", () => {
        set1.increment("node1", 10);
        set1.increment("node2", 5);

        expect(set1.value()).toBe(30);
    });

    test("Test Compare", () => {
        let set2 = new GCounter({ "node1": 5, "node2": 10});
        let set3 = new GCounter({ "node1": 5, "node2": 10, "node3": 15 });

        expect(set1.compare(set2)).toBe(true);
        set1.increment("node1", 5);
        expect(set1.compare(set2)).toBe(false);
        expect(set1.compare(set3)).toBe(false);
    });

    test("Test Merge", () => {
        let set2 = new GCounter({ "node1": 3, "node2": 10});
        let set3 = new GCounter({ "node1": 5, "node3": 15});

        expect(set1.counts).toEqual({"node1": 5, "node2": 10});
        set2.merge(set1);
        expect(set2.counts).toEqual({"node1": 5, "node2": 10});
        set1.merge(set3);
        expect(set1.counts).toEqual({"node1": 5, "node2": 10, "node3": 15});
    });
});
