import { describe, test, expect, beforeEach } from "vitest";
import { LWWElementSet, Bias } from "../src/crdts/LWWElementSet/index.js";

describe("LWW-Element-Set Tests", () => {
    const testValues = ["walter", "jesse", "mike"];

    let set1: LWWElementSet<string>;
    let set2: LWWElementSet<string>;
    let set3: LWWElementSet<string>;

    beforeEach(() => {
        set1 = new LWWElementSet<string>(new Map(), new Map(), Bias.ADD);
        set2 = new LWWElementSet<string>(new Map(), new Map(), Bias.ADD);
        set3 = new LWWElementSet<string>(new Map(), new Map(), Bias.REMOVE);

        testValues.forEach((value) => {
            set1.add(value);
            set2.add(value);
            set3.add(value);
        });
    });

    test("Test Add Elements", () => {
        expect(set1.lookup("gustavo")).toBe(false);

        set1.add("gustavo");
        expect(set1.lookup("gustavo")).toBe(true);
    });

    test("Test Remove Elements", () => {
        expect(set1.lookup("mike")).toBe(true);

        set1.getRemoves().set("mike", Date.now() + 1);

        expect(set1.lookup("mike")).toBe(false);
    });

    test("Test Compare Sets", () => {
        expect(set1.compare(set2)).toBe(true);
        expect(set1.compare(set3)).toBe(true);
        expect(set3.compare(set2)).toBe(true);

        set1.remove("jesse");

        expect(set1.compare(set2)).toBe(false);
        expect(set1.compare(set3)).toBe(false);
        expect(set3.compare(set2)).toBe(true);
    });

    describe("Test Merge Elements" , () => {
        test("Merge Sets", () => {
            // Adding different names to each set
            set1.add("gustavo");
            set2.add("saul");

            expect(set1.compare(set2)).toBe(false);

            set1.merge(set2);
            set2.merge(set1);

            expect(set1.compare(set2)).toBe(true);
        });

        test("Same Element, different Timestamps", () => {
            const timestamp = Date.now();
            set1.getAdds().set("gustavo", timestamp);
            set2.getAdds().set("gustavo", timestamp + 5);

            expect(set1.getAdds().get("gustavo")).toBe(timestamp);

            set1.merge(set2);
            set2.merge(set1);

            expect(set1.getAdds().get("gustavo")).toBe(timestamp + 5);
            expect(set2.getAdds().get("gustavo")).toBe(timestamp + 5);
        });

        test("Merge Removal Timestamps", () => {
            const timestamp = Date.now();

            set1.getAdds().set("gustavo", timestamp);
            set2.getRemoves().set("gustavo", timestamp + 5);

            set1.merge(set2);

            expect(set1.lookup("gustavo")).toBe(false);
            expect(set1.getRemoves().get("gustavo")).toBe(timestamp + 5);
        });
    });
});
