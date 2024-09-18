import { beforeEach, describe, expect, test } from "vitest";
import { TwoPSet } from "../src/crdts/2PSet/index.js";
import { GSet } from "../src/crdts/GSet/index.js";

describe("2P-Set Tests", () => {
	let set1: TwoPSet<string>;
	let set2: TwoPSet<string>;

	beforeEach(() => {
		set1 = new TwoPSet<string>(
			new GSet<string>(new Set<string>(["walter", "jesse", "mike"])),
			new GSet<string>(new Set<string>()),
		);
		set2 = new TwoPSet<string>(
			new GSet<string>(new Set<string>(["walter", "jesse", "mike"])),
			new GSet<string>(new Set<string>()),
		);
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
