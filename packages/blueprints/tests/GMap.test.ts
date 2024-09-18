import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { GMap } from "../src/crdts/GMap/index.js";

describe("G-Map Tests", () => {
	let map1: GMap<string, number>;
	let map2: GMap<string, number>;

	beforeEach(() => {
		map1 = new GMap<string, number>(new Map<string, number>([["walter", 1], ["jesse", 2], ["mike", 3]]));
		map2 = new GMap<string, number>(new Map<string, number>([["walter", 1], ["jesse", 2], ["mike", 3]]));
	});

	test("Test Add", () => {
		map1.add("gustavo", 4);
		map2.add("gustavo", 4);

		expect(map1.get("gustavo")).toBe(4);
		expect(map2.get("gustavo")).toBe(4);
	});

	test("Test Add Existing Key", () => {
		map1.add("walter", 5);
		expect(map1.get("walter")).toBe(1);  // Should not change existing value
	});

	test("Test Compare", () => {
		expect(map1.compare(map2)).toBe(true);

		map1.add("gustavo", 4);

		expect(map1.compare(map2)).toBe(false);

		map2.add("gustavo", 4);

		expect(map1.compare(map2)).toBe(true);
	});

	test("Test Merge", () => {
		map1.add("gustavo", 4);
		map2.add("lalo", 5);

		expect(map1.compare(map2)).toBe(false);

		map1.merge(map2);
		map2.merge(map1);

		expect(map1.compare(map2)).toBe(true);
		expect(map1.get("gustavo")).toBe(4);
		expect(map1.get("lalo")).toBe(5);
		expect(map2.get("gustavo")).toBe(4);
		expect(map2.get("lalo")).toBe(5);
	});

	test("Test Has", () => {
		expect(map1.has("walter")).toBe(true);
		expect(map1.has("gustavo")).toBe(false);
	});
});
