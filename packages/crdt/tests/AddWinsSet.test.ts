import { beforeEach, describe, expect, test } from "vitest";
import { AddWinsSet } from "../src/cros/AddWinsSet/index.js";

describe("HashGraph for AddWinSet tests", () => {
	let cro: AddWinsSet<number>;

	beforeEach(() => {
		cro = new AddWinsSet();
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
