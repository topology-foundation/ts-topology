import { beforeEach, describe, expect, test } from "vitest";
import { AddWinsSet } from "../../crdt/src/cros/AddWinsSet/index.js";
import { type TopologyObject, merge, newTopologyObject } from "../src/index.js";

describe("HashGraph for AddWinSet tests", () => {
	let obj1: TopologyObject<number>;
	let obj2: TopologyObject<number>;
	let obj3: TopologyObject<number>;

	beforeEach(async () => {
		obj1 = await newTopologyObject("peer1", new AddWinsSet<number>());
		obj2 = await newTopologyObject("peer2", new AddWinsSet<number>());
		obj3 = await newTopologyObject("peer3", new AddWinsSet<number>());
	});

	test("Test: Add Two Vertices", () => {
		/*
      V1:NOP <- V2:ADD(1) <- V2:REMOVE(1)
    */
		// root: 02465e287e3d086f12c6edd856953ca5ad0f01d6707bf8e410b4a601314c1ca5

		const cro1 = obj1.cro as AddWinsSet<number>;
		// df50d0a583cb46e651b1a05dcef7f7e0bf9851cd5d9f63ca425c9c9103f94417
		cro1.add(1);
		// 73205ffce4c18099fb5d8ce1d90620a4604c9169bf17a9b6b787265412d514cb
		cro1.remove(1);
		expect(cro1.contains(1)).toBe(false);

		const linearOps = obj1.hashGraph.linearizeOperations();
		console.log(linearOps);
		expect(linearOps).toEqual([
			{ type: "add", value: 1 },
			{ type: "remove", value: 1 },
		]);
	});

	test("Test: Add Two Concurrent Vertices With Same Value", () => {
		/*
                  _ V2:REMOVE(1)
      V1:ADD(1) /
                \ _ V3:ADD(1)
    */
		// root: 02465e287e3d086f12c6edd856953ca5ad0f01d6707bf8e410b4a601314c1ca5

		const cro1 = obj1.cro as AddWinsSet<number>;
		const cro2 = obj2.cro as AddWinsSet<number>;

		cro1.add(1);
		merge(obj2, obj1.hashGraph.getAllVertices());

		cro1.remove(1);
		cro2.add(1);
		merge(obj1, obj2.hashGraph.getAllVertices());
		merge(obj2, obj1.hashGraph.getAllVertices());

		console.log(obj1.cro);
		expect(cro1.contains(1)).toBe(true);
		expect(obj1.hashGraph.vertices).toEqual(obj2.hashGraph.vertices);

		const linearOps = obj1.hashGraph.linearizeOperations();
		expect(linearOps).toEqual([
			{ type: "add", value: 1 },
			{ type: "add", value: 1 },
		]);
	});

	test("Test: Add Two Concurrent Vertices With Different Values", () => {
		/*
                  _ V2:REMOVE(1)
      V1:ADD(1) /
                \ _ V3:ADD(2)
    */
		// expect(linearOps).toEqual([op0, op1, op2]);
	});

	test("Test: Tricky Case", () => {
		/*
                  ___  V2:REMOVE(1) <- V4:ADD(10)
      V1:ADD(1) /
                \ ___  V3:ADD(1) <- V5:REMOVE(5)
    */
	});

	test("Test: Yuta Papa's Case", () => {
		/*
                  ___  V2:REMOVE(1) <- V4:ADD(2)
      V1:ADD(1) /
                \ ___  V3:REMOVE(2) <- V5:ADD(1)
    */
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
	});

	test("Test: Joao's latest brain teaser", () => {
		/*
                 __ V2:Add(2) <------------\
      V1:Add(1) /                           \ - V5:RM(2)
                \__ V3:RM(2) <- V4:RM(2) <--/
    */
	});
});
