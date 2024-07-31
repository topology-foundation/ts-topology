import { describe, test, expect, beforeEach } from "vitest";
import { IPSet } from "../src/builtins/IPSet";
import { GCounter } from "../src/builtins/GCounter";

describe("Infinite-phase set Tests", () => {
    const peerId = "node";

    let set1: IPSet<string>;
    let set2: IPSet<number>;
    let set3: IPSet<number>;

    beforeEach(() => {
        set1 = new IPSet<string>(new Map());
        set2 = new IPSet<number>(new Map());
        set3 = new IPSet<number>(new Map());
    });

    test("Test Add Elements", () => {
        expect(set1.contains("alice")).toBe(false);

        set1.add(peerId, "alice");
        expect(set1.contains("alice")).toBe(true);
        expect(set1.contains("bob")).toBe(false);

        set1.add(peerId, "alice");
        expect(set1.contains("alice")).toBe(true);
    });

    test("Test Add and Remove Elements", () => {
        expect(set1.contains("alice")).toBe(false);

        set1.add(peerId, "alice");
        set1.remove(peerId, "alice");
        expect(set1.contains("alice")).toBe(false);

        set1.add(peerId, "alice");
        set1.add(peerId, "alice");
        set1.remove(peerId, "alice");
        expect(set1.contains("alice")).toBe(false);

        set1.add(peerId, "alice");
        set1.add(peerId, "alice");
        set1.remove(peerId, "alice");
        set1.remove(peerId, "alice");
        set1.add(peerId, "alice");
        set1.add(peerId, "alice");
        set1.add(peerId, "alice");
        expect(set1.contains("alice")).toBe(true);

        set1.add(peerId, "alice");
        set1.remove(peerId, "alice");
        set1.add(peerId, "alice");
        set1.remove(peerId, "alice");
        set1.add(peerId, "alice");
        expect(set1.contains("alice")).toBe(true);
    });

    describe("Test Merge Elements", () => {
        test("Merge Sets Overlapping", () => {
            set2.add(peerId, 1);
            set2.add(peerId, 1);
            set2.remove(peerId, 3);
            set2.add(peerId, 3);
            set2.remove(peerId, 3);
            set2.add(peerId, 5);
            set2.remove(peerId, 5);
            set2.add(peerId, 5);

            set3.add(peerId, 1);
            set3.remove(peerId, 1);
            set3.add(peerId, 3);

            console.log(
                "Merging {1:1, 3:2, 5:3} and {1:2, 3:1} should yield {1:2, 3:2, 5:3}"
            );

            set2.merge(set3);
            expect(set2).toStrictEqual(
                new IPSet<number>(
                    new Map([
                        [1, new GCounter({ [peerId]: 2 })],
                        [3, new GCounter({ [peerId]: 2 })],
                        [5, new GCounter({ [peerId]: 3 })],
                    ])
                )
            );
        });
        test("Merge Sets Non-Overlapping", () => {
            set2.add(peerId, 1);
            set2.add(peerId, 3);

            set3.add(peerId, 5);
            set3.add(peerId, 7);

            console.log(
                "Merging {1:1, 3:1} and {5:1, 7:1} should yield {1:1, 3:1, 5:1, 7:1}"
            );
            set3.merge(set2);
            expect(set3).toStrictEqual(
                new IPSet<number>(
                    new Map([
                        [1, new GCounter({ [peerId]: 1 })],
                        [3, new GCounter({ [peerId]: 1 })],
                        [5, new GCounter({ [peerId]: 1 })],
                        [7, new GCounter({ [peerId]: 1 })],
                    ])
                )
            );
        });
    });

    test("Test Compare Sets", () => {
        expect(set2.compare(set2)).toBe(true);
        expect(set2.compare(set3)).toBe(true);
        expect(set3.compare(set2)).toBe(true);

        set2.add(peerId, 1);

        expect(set2.compare(set3)).toBe(false);
        expect(set3.compare(set2)).toBe(true);

        set3.add(peerId, 1);
        expect(set2.compare(set3)).toBe(true);
        expect(set3.compare(set2)).toBe(true);

        set2.remove(peerId, 1);
        expect(set2.compare(set3)).toBe(false);
        expect(set3.compare(set2)).toBe(true);
    });

    test("Test set() function", () => {
        [1, 2, 3, 4, 5].forEach((i) => set2.add(peerId, i));
        expect(set2.set()).toStrictEqual(new Set([1, 2, 3, 4, 5]));

        [1, 3, 4].forEach((i) => set2.remove(peerId, i));
        expect(set2.set()).toStrictEqual(new Set([2, 5]));

        [1, 2, 3].forEach((i) => set2.remove(peerId, i));
        expect(set2.set()).toStrictEqual(new Set([5]));

        [1, 2, 3].forEach((i) => set2.add(peerId, i));
        expect(set2.set()).toStrictEqual(new Set([1, 2, 3, 5]));
    });
});
