import { beforeEach, describe, expect, test } from "vitest";
import { BitSet } from "../src/hashgraph/bitset.js";

describe("BitSet Test", () => {
	let bitset: BitSet;

	beforeEach(() => {
		bitset = new BitSet(1 << 7);
	});

	test("Test: BitSet", () => {
		expect(bitset.size()).toBe(1 << 7);
		bitset.set(0);
		bitset.set(50);

		expect(bitset.get(0)).toBe(true);
		expect(bitset.get(49)).toBe(false);
		expect(bitset.get(50)).toBe(true);

		bitset.flip(49);
		bitset.flip(50);
		expect(bitset.get(49)).toBe(true);
		expect(bitset.get(50)).toBe(false);

		bitset.clear();

		let other: BitSet = new BitSet(1 << 7);
		expect(other.size()).toBe(1 << 7);
		other.set(0);
		other = other.or(bitset);
		expect(other.get(0)).toBe(true);

		other = other.and(bitset);
		expect(other.get(0)).toBe(false);
	});
});
