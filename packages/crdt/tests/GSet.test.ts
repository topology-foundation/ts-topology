import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { GSet } from "../src/crdts/GSet/index.js";

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
