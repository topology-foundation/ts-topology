import { beforeEach, describe, expect, test } from "vitest";
import { GCounter } from "../src/crdts/GCounter/index.js";
import { PNCounter } from "../src/crdts/PNCounter/index.js";

describe("PN-Counter Tests", () => {
	let set1: PNCounter;
	let set2: PNCounter;

	beforeEach(() => {
		set1 = new PNCounter(
			new GCounter({ node1: 5, node2: 10, node3: 15 }),
			new GCounter({ node1: 3, node2: 4, node3: 3 }),
		);
		set2 = new PNCounter(
			new GCounter({ node1: 5, node2: 10, node3: 15 }),
			new GCounter({ node1: 3, node2: 4, node3: 3 }),
		);
	});

	test("Test Initial Value", () => {
		expect(set1.value()).toBe(20);
		expect(set2.value()).toBe(20);
	});

	test("Test Increment", () => {
		set1.increment("node1", 10);
		set2.increment("node1", 20);
		expect(set1.value()).toBe(30);
		expect(set2.value()).toBe(40);
	});

	test("Test Decrement", () => {
		set1.decrement("node1", 10);
		set2.decrement("node1", 20);
		expect(set1.value()).toBe(10);
		expect(set2.value()).toBe(0);
	});

	test("Test Compare", () => {
		expect(set1.compare(set2)).toBe(true);
		set1.decrement("node1", 10);
		expect(set1.compare(set2)).toBe(false);
		set2.decrement("node1", 10);
		expect(set1.compare(set2)).toBe(true);
	});

	test("Test Merge", () => {
		set1.increment("node1", 10);
		set2.decrement("node2", 5);
		expect(set1.compare(set2)).toBe(false);
		expect(set2.compare(set1)).toBe(false);
		set1.merge(set2);
		set2.merge(set1);
		expect(set1.compare(set2)).toBe(true);
		expect(set2.compare(set1)).toBe(true);
	});
});
