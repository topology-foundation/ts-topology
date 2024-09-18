import { beforeEach, describe, expect, test } from "vitest";
import { PseudoRandomWinsSet } from "../src/cros/PseudoRandomWinsSet/index.js";

describe("HashGraph for PseudoRandomWinsSet tests", () => {
	let cro: PseudoRandomWinsSet<number>;

	beforeEach(() => {
		cro = new PseudoRandomWinsSet();
	});

	test("Test: Add", () => {
		cro.add(1);
		let set = cro.values();
		expect(set).toEqual([1]);

		cro.add(2);
		set = cro.values();
		expect(set).toEqual([1, 2]);
	});

	test("Test: Add and Remove", () => {
		cro.add(1);
		let set = cro.values();
		expect(set).toEqual([1]);

		cro.add(2);
		set = cro.values();
		expect(set).toEqual([1, 2]);

		cro.remove(1);
		set = cro.values();
		expect(cro.contains(1)).toBe(false);
		expect(set).toEqual([2]);
	});
});
