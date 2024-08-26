import { beforeEach, describe, expect, test } from "vitest";
import { type ElementTuple, OORSet } from "../src/crdts/OORSet";

describe("OR-Set Tests", () => {
	let set1: OORSet<string>;
	let set2: OORSet<string>;

	const testValues = ["walter", "jesse", "mike"];

	beforeEach(() => {
		set1 = new OORSet<string>("set1", new Set<ElementTuple<string>>());
		set2 = new OORSet<string>("set2", new Set<ElementTuple<string>>());

		for (const value of testValues) {
			set1.add("set1", value);
			set2.add("set2", value);
		}
	});

	test("Test Add Elements", () => {
		expect(set1.lookup("gustavo")).toBe(false);

		set1.add("set1", "gustavo");

		expect(set1.lookup("gustavo")).toBe(true);
	});

	test("Test Remove Elements", () => {
		expect(set1.lookup("mike")).toBe(true);

		set1.remove("mike");

		expect(set1.lookup("mike")).toBe(false);
	});

	test("Test Merge Elements", () => {
		expect(set1.compare(set2)).toBe(false);

		set1.merge(set2);
		set2.merge(set1);

		expect(set1.compare(set2)).toBe(true);
	});
});
