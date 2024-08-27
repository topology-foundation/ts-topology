import { beforeEach, describe, expect, test } from "vitest";
import { AddWinsSet } from "../src/cros/AddWinsSet/index.js";

describe("HashGraph for AddWinSet tests", () => {
	let cro1: AddWinsSet<number>;
	let cro2: AddWinsSet<number>;
	let cro3: AddWinsSet<number>;

	beforeEach(() => {
		cro1 = new AddWinsSet();
		cro2 = new AddWinsSet();
		cro3 = new AddWinsSet();
	});

	test("Test: Add Two Vertices", () => {
		/*
      V1:NOP <- V2:ADD(1) <- V2:REMOVE(1)
    */
		cro1.add(1);
		let set = cro1.values();
		expect(set).toEqual([1]);
		cro1.remove(1);
		set = cro1.values();
		expect(set).toEqual([]);
	});

	test("Test: Add Two Concurrent Vertices With Same Value", () => {
		/*
                  _ V2:REMOVE(1)
      V1:ADD(1) /
                \ _ V3:ADD(1)
    */

		cro1.add(1);
		cro1.merge(cro2);
		cro2.merge(cro1);
		let set1 = cro1.values();
		let set2 = cro2.values();
		expect(set1).toEqual([1]);
		expect(set1).toEqual(set2);

		cro1.remove(1);
		cro2.add(1);
		cro1.merge(cro2);
		cro2.merge(cro1);
		set1 = cro1.values();
		set2 = cro2.values();
		expect(set1).toEqual([1]);
		expect(set1).toEqual(set2);
	});

	test("Test: Add Two Concurrent Vertices With Different Values", () => {
		/*
                  _ V2:REMOVE(1)
      V1:ADD(1) /
                \ _ V3:ADD(2)
    */

		cro1.add(1);
		cro1.merge(cro2);
		cro2.merge(cro1);
		let set1 = cro1.values();
		let set2 = cro2.values();
		expect(set1).toEqual([1]);
		expect(set1).toEqual(set2);

		cro1.remove(1);
		cro2.add(2);
		cro1.merge(cro2);
		cro2.merge(cro1);
		set1 = cro1.values();
		set2 = cro2.values();
		expect(set1).toEqual([2]);
		expect(set1).toEqual(set2);
	});

	test("Test: Tricky Case", () => {
		/*
                  ___  V2:REMOVE(1) <- V4:ADD(10)
      V1:ADD(1) /
                \ ___  V3:ADD(1) <- V5:REMOVE(5)
    */

		cro1.add(1);
		cro1.merge(cro2);
		cro2.merge(cro1);
		let set1 = cro1.values();
		let set2 = cro2.values();
		expect(set1).toEqual([1]);
		expect(set1).toEqual(set2);

		cro1.remove(1);
		cro2.add(1);
		cro1.add(10);
		cro2.remove(5);
		cro1.merge(cro2);
		cro2.merge(cro1);
		set1 = cro1.values();
		set2 = cro2.values();
		expect(set1).toEqual([1, 10]);
		expect(set1).toEqual(set2);
	});

	test("Test: Yuta Papa's Case", () => {
		/*
                  ___  V2:REMOVE(1) <- V4:ADD(2)
      V1:ADD(1) /
                \ ___  V3:REMOVE(2) <- V5:ADD(1)
    */

		cro1.add(1);
		cro1.merge(cro2);
		cro2.merge(cro1);
		let set1 = cro1.values();
		let set2 = cro2.values();
		expect(set1).toEqual([1]);
		expect(set1).toEqual(set2);

		cro1.remove(1);
		cro2.remove(2);
		cro1.add(2);
		cro2.add(1);
		cro1.merge(cro2);
		cro2.merge(cro1);
		set1 = cro1.values();
		set2 = cro2.values();
		expect(set1).toEqual([1, 2]);
		expect(set1).toEqual(set2);
	});

	test("Test: Mega Complex Case", () => {
		/*
                                               __ V6:ADD(3)
                                             /
                  ___  V2:ADD(1) <-- V3:RM(2) <-- V7:RM(1) <-- V8:RM(3)
                /                              ______________/
      V1:ADD(1)/                              /
               \                             /
                \ ___  V4:RM(2) <-- V5:ADD(2) <-- V9:RM(1)
    */

		cro1.add(1);
		cro1.merge(cro2);
		cro1.merge(cro3);
		cro2.merge(cro1);
		cro2.merge(cro3);
		cro3.merge(cro1);
		cro3.merge(cro2);

		let set1 = cro1.values();
		let set2 = cro2.values();
		let set3 = cro3.values();

		expect(set1).toEqual([1]);
		expect(set1).toEqual(set2);
		expect(set1).toEqual(set3);

		cro1.add(1);
		cro1.remove(2);
		cro2.remove(2);
		cro2.add(2);
		cro3.add(3);
		cro1.remove(1);
		cro1.merge(cro2);
		cro1.remove(3);
		cro2.remove(1);

		cro1.merge(cro2);
		cro1.merge(cro3);
		cro2.merge(cro1);
		cro2.merge(cro3);
		cro3.merge(cro1);
		cro3.merge(cro2);

		set1 = cro1.values();
		set2 = cro2.values();
		set3 = cro3.values();

		expect(set1).toEqual([2, 3]);
		expect(set1).toEqual(set2);
		expect(set1).toEqual(set3);
	});

	test("Test: Mega Complex Case 1", () => {
		/*
                                               __ V6:ADD(3)
                                             /
                  ___  V2:ADD(1) <-- V3:RM(2) <-- V7:RM(1) <-- V8:RM(3)
                /                                       ^
      V1:ADD(1)/                                         \
               \                                          \
                \ ___  V4:RM(2) <-------------------- V5:ADD(2) <-- V9:RM(1)
    */

		cro1.add(1);
		cro1.merge(cro2);
		cro1.merge(cro3);
		cro2.merge(cro1);
		cro2.merge(cro3);
		cro3.merge(cro1);
		cro3.merge(cro2);

		let set1 = cro1.values();
		let set2 = cro2.values();
		let set3 = cro3.values();

		expect(set1).toEqual([1]);
		expect(set1).toEqual(set2);
		expect(set1).toEqual(set3);

		cro1.add(1);
		cro1.remove(2);
		cro2.remove(2);
		cro2.merge(cro1);
		cro2.add(2);
		cro3.add(3);
		cro1.remove(1);
		cro1.remove(3);
		cro2.remove(1);

		cro1.merge(cro2);
		cro1.merge(cro3);
		cro2.merge(cro1);
		cro2.merge(cro3);
		cro3.merge(cro1);
		cro3.merge(cro2);

		set1 = cro1.values();
		set2 = cro2.values();
		set3 = cro3.values();

		expect(set1).toEqual([2, 3]);
		expect(set1).toEqual(set2);
		expect(set1).toEqual(set3);
	});

	test("Test: Joao's latest brain teaser", () => {
		/*
                 __ V2:Add(2) <------------\
      V1:Add(1) /                           \ - V5:RM(2)
                \__ V3:RM(2) <- V4:RM(2) <--/
    */

		cro1.add(1);
		cro1.merge(cro2);
		cro2.merge(cro1);
		let set1 = cro1.values();
		let set2 = cro2.values();
		expect(set1).toEqual([1]);
		expect(set1).toEqual(set2);

		cro1.add(2);
		cro2.remove(2);
		cro2.remove(2);
		cro1.merge(cro2);
		cro1.remove(2);
		cro1.merge(cro2);
		cro2.merge(cro1);
		set1 = cro1.values();
		set2 = cro2.values();
		expect(set1).toEqual([1, 2]);
		expect(set1).toEqual(set2);
	});
});
