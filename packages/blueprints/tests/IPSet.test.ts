import { beforeEach, describe, expect, test } from "vitest";
import { GCounter } from "../src/crdts/GCounter/index.js";
import { IPSet } from "../src/crdts/IPSet/index.js";

describe("Infinite-phase set Tests", () => {
	const nodeId = "node";

	let set1: IPSet<string>;
	let set2: IPSet<number>;
	let set3: IPSet<number>;

	beforeEach(() => {
		set1 = new IPSet<string>();
		set2 = new IPSet<number>();
		set3 = new IPSet<number>();
	});

	test("Test Add Elements", () => {
		expect(set1.contains("alice")).toBe(false);

		set1.add(nodeId, "alice");
		expect(set1.contains("alice")).toBe(true);
		expect(set1.contains("bob")).toBe(false);

		set1.add(nodeId, "alice");
		expect(set1.contains("alice")).toBe(true);
	});

	test("Test Add and Remove Elements", () => {
		expect(set1.contains("alice")).toBe(false);

		set1.add(nodeId, "alice");
		set1.remove(nodeId, "alice");
		expect(set1.contains("alice")).toBe(false);

		set1.add(nodeId, "alice");
		set1.add(nodeId, "alice");
		set1.remove(nodeId, "alice");
		expect(set1.contains("alice")).toBe(false);

		set1.add(nodeId, "alice");
		set1.add(nodeId, "alice");
		set1.remove(nodeId, "alice");
		set1.remove(nodeId, "alice");
		set1.add(nodeId, "alice");
		set1.add(nodeId, "alice");
		set1.add(nodeId, "alice");
		expect(set1.contains("alice")).toBe(true);

		set1.add(nodeId, "alice");
		set1.remove(nodeId, "alice");
		set1.add(nodeId, "alice");
		set1.remove(nodeId, "alice");
		set1.add(nodeId, "alice");
		expect(set1.contains("alice")).toBe(true);
	});

	describe("Test Merge Elements", () => {
		test("Merge Sets Overlapping", () => {
			set2.add(nodeId, 1);
			set2.add(nodeId, 1);
			set2.remove(nodeId, 3);
			set2.add(nodeId, 3);
			set2.remove(nodeId, 3);
			set2.add(nodeId, 5);
			set2.remove(nodeId, 5);
			set2.add(nodeId, 5);

			set3.add(nodeId, 1);
			set3.remove(nodeId, 1);
			set3.add(nodeId, 3);

			set2.merge(set3);
			expect(set2).toStrictEqual(
				new IPSet<number>(
					new Map([
						[1, new GCounter({ [nodeId]: 2 })],
						[3, new GCounter({ [nodeId]: 2 })],
						[5, new GCounter({ [nodeId]: 3 })],
					]),
				),
			);
		});
		test("Merge Sets Non-Overlapping", () => {
			set2.add(nodeId, 1);
			set2.add(nodeId, 3);

			set3.add(nodeId, 5);
			set3.add(nodeId, 7);

			set3.merge(set2);
			expect(set3).toStrictEqual(
				new IPSet<number>(
					new Map([
						[1, new GCounter({ [nodeId]: 1 })],
						[3, new GCounter({ [nodeId]: 1 })],
						[5, new GCounter({ [nodeId]: 1 })],
						[7, new GCounter({ [nodeId]: 1 })],
					]),
				),
			);
		});
	});

	test("Test Compare Sets", () => {
		expect(set2.compare(set2)).toBe(true);
		expect(set2.compare(set3)).toBe(true);
		expect(set3.compare(set2)).toBe(true);

		set2.add(nodeId, 1);

		expect(set2.compare(set3)).toBe(false);
		expect(set3.compare(set2)).toBe(true);

		set3.add(nodeId, 1);
		expect(set2.compare(set3)).toBe(true);
		expect(set3.compare(set2)).toBe(true);

		set2.remove(nodeId, 1);
		expect(set2.compare(set3)).toBe(false);
		expect(set3.compare(set2)).toBe(true);
	});

	test("Test set() function", () => {
		for (const i of [1, 2, 3, 4, 5]) {
			set2.add(nodeId, i);
		}
		expect(set2.set()).toStrictEqual(new Set([1, 2, 3, 4, 5]));

		for (const i of [1, 3, 4]) {
			set2.remove(nodeId, i);
		}
		expect(set2.set()).toStrictEqual(new Set([2, 5]));

		for (const i of [1, 2, 3]) {
			set2.remove(nodeId, i);
		}
		expect(set2.set()).toStrictEqual(new Set([5]));

		for (const i of [1, 2, 3]) {
			set2.add(nodeId, i);
		}
		expect(set2.set()).toStrictEqual(new Set([1, 2, 3, 5]));
	});
});
