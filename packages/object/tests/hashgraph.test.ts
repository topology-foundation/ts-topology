import { beforeEach, describe, expect, test } from "vitest";
import { AddWinsSet } from "../../crdt/src/cros/AddWinsSet/index.js";
import { PseudoRandomWinsSet } from "../../crdt/src/cros/PseudoRandomWinsSet/index.js";
import { TopologyObject } from "../src/index.js";

describe("HashGraph for AddWinSet tests", () => {
	let obj1: TopologyObject;
	let obj2: TopologyObject;
	let obj3: TopologyObject;
	let obj4: TopologyObject;
	let obj5: TopologyObject;
	let obj6: TopologyObject;
	let obj7: TopologyObject;
	let obj8: TopologyObject;

	beforeEach(async () => {
		obj1 = new TopologyObject("peer1", new AddWinsSet<number>());
		obj2 = new TopologyObject("peer2", new AddWinsSet<number>());
		obj3 = new TopologyObject("peer3", new AddWinsSet<number>());
		obj4 = new TopologyObject("peer4", new PseudoRandomWinsSet<number>());
		obj5 = new TopologyObject("peer5", new PseudoRandomWinsSet<number>());
		obj6 = new TopologyObject("peer6", new PseudoRandomWinsSet<number>());
		obj7 = new TopologyObject("peer7", new PseudoRandomWinsSet<number>());
		obj8 = new TopologyObject("peer8", new PseudoRandomWinsSet<number>());
	});

	test("Test: Add Two Vertices", () => {
		/*
      V1:NOP <- V2:ADD(1) <- V2:REMOVE(1)
    */

		const cro1 = obj1.cro as AddWinsSet<number>;
		cro1.add(1);
		cro1.remove(1);
		expect(cro1.contains(1)).toBe(false);

		const linearOps = obj1.hashGraph.linearizeOperations();
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

		const cro1 = obj1.cro as AddWinsSet<number>;
		const cro2 = obj2.cro as AddWinsSet<number>;

		cro1.add(1);
		obj2.merge(obj1.hashGraph.getAllVertices());

		cro1.remove(1);
		cro2.add(1);
		obj1.merge(obj2.hashGraph.getAllVertices());
		obj2.merge(obj1.hashGraph.getAllVertices());

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

		const cro1 = obj1.cro as AddWinsSet<number>;
		const cro2 = obj2.cro as AddWinsSet<number>;

		cro1.add(1);
		obj2.merge(obj1.hashGraph.getAllVertices());

		cro1.remove(1);
		cro2.add(2);
		obj1.merge(obj2.hashGraph.getAllVertices());
		obj2.merge(obj1.hashGraph.getAllVertices());

		expect(cro1.contains(1)).toBe(false);
		expect(cro1.contains(2)).toBe(true);
		expect(obj1.hashGraph.vertices).toEqual(obj2.hashGraph.vertices);

		const linearOps = obj1.hashGraph.linearizeOperations();
		console.log(linearOps);
		console.log([
			{ type: "add", value: 1 },
			{ type: "add", value: 2 },
			{ type: "remove", value: 1 },
		]);
		expect(linearOps).toEqual([
			{ type: "add", value: 1 },
			{ type: "add", value: 2 },
			{ type: "remove", value: 1 },
		]);
	});

	test("Test: Tricky Case", () => {
		/*
                  ___  V2:REMOVE(1) <- V4:ADD(10)
      V1:ADD(1) /
                \ ___  V3:ADD(1) <- V5:REMOVE(5)
    */

		const cro1 = obj1.cro as AddWinsSet<number>;
		const cro2 = obj2.cro as AddWinsSet<number>;

		cro1.add(1);
		obj2.merge(obj1.hashGraph.getAllVertices());

		cro1.remove(1);
		cro2.add(1);
		cro1.add(10);
		cro2.remove(5);
		obj1.merge(obj2.hashGraph.getAllVertices());
		obj2.merge(obj1.hashGraph.getAllVertices());

		expect(cro1.contains(1)).toBe(true);
		expect(cro1.contains(10)).toBe(true);
		expect(cro1.contains(5)).toBe(false);
		expect(obj1.hashGraph.vertices).toEqual(obj2.hashGraph.vertices);

		const linearOps = obj1.hashGraph.linearizeOperations();
		expect(linearOps).toEqual([
			{ type: "add", value: 1 },
			{ type: "add", value: 1 },
			{ type: "remove", value: 5 },
			{ type: "add", value: 10 },
		]);
	});

	test("Test: Yuta Papa's Case", () => {
		/*
                  ___  V2:REMOVE(1) <- V4:ADD(2)
      V1:ADD(1) /
                \ ___  V3:REMOVE(2) <- V5:ADD(1)
    */

		const cro1 = obj1.cro as AddWinsSet<number>;
		const cro2 = obj2.cro as AddWinsSet<number>;

		cro1.add(1);
		obj2.merge(obj1.hashGraph.getAllVertices());

		cro1.remove(1);
		cro2.remove(2);
		cro1.add(2);
		cro2.add(1);
		obj1.merge(obj2.hashGraph.getAllVertices());
		obj2.merge(obj1.hashGraph.getAllVertices());

		expect(cro1.contains(1)).toBe(true);
		expect(cro1.contains(2)).toBe(true);
		expect(obj1.hashGraph.vertices).toEqual(obj2.hashGraph.vertices);

		const linearOps = obj1.hashGraph.linearizeOperations();
		expect(linearOps).toEqual([
			{ type: "add", value: 1 },
			{ type: "add", value: 1 },
			{ type: "add", value: 2 },
		]);
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

		const cro1 = obj1.cro as AddWinsSet<number>;
		const cro2 = obj2.cro as AddWinsSet<number>;
		const cro3 = obj3.cro as AddWinsSet<number>;

		cro1.add(1);
		obj2.merge(obj1.hashGraph.getAllVertices());

		cro1.add(1);
		cro1.remove(2);
		cro2.remove(2);
		cro2.add(2);

		obj3.merge(obj1.hashGraph.getAllVertices());
		cro3.add(3);
		cro1.remove(1);

		obj1.merge(obj2.hashGraph.getAllVertices());
		cro1.remove(3);
		cro2.remove(1);

		obj1.merge(obj2.hashGraph.getAllVertices());
		obj1.merge(obj3.hashGraph.getAllVertices());
		obj2.merge(obj1.hashGraph.getAllVertices());
		obj2.merge(obj3.hashGraph.getAllVertices());
		obj3.merge(obj1.hashGraph.getAllVertices());
		obj3.merge(obj2.hashGraph.getAllVertices());

		expect(cro1.contains(1)).toBe(false);
		expect(cro1.contains(2)).toBe(true);
		expect(cro1.contains(3)).toBe(true);
		expect(obj1.hashGraph.vertices).toEqual(obj2.hashGraph.vertices);
		expect(obj1.hashGraph.vertices).toEqual(obj3.hashGraph.vertices);

		const linearOps = obj1.hashGraph.linearizeOperations();
		expect(linearOps).toEqual([
			{ type: "add", value: 1 },
			{ type: "remove", value: 2 },
			{ type: "add", value: 2 },
			{ type: "add", value: 1 },
			{ type: "add", value: 3 },
			{ type: "remove", value: 1 },
		]);
	});

	test("Test: Mega Complex Case 1", () => {
		/*
                                               __ V5:ADD(3)
                                             /
                  ___  V2:ADD(1) <-- V3:RM(2) <-- V6:RM(1) <-- V8:RM(3)
                /                                       ^
      V1:ADD(1)/                                         \
               \                                          \
                \ ___  V4:RM(2) <-------------------- V7:ADD(2) <-- V9:RM(1)
    */

		const cro1 = obj1.cro as AddWinsSet<number>;
		const cro2 = obj2.cro as AddWinsSet<number>;
		const cro3 = obj3.cro as AddWinsSet<number>;

		cro1.add(1);
		obj2.merge(obj1.hashGraph.getAllVertices());

		cro1.add(1);
		cro1.remove(2);
		cro2.remove(2);

		obj3.merge(obj1.hashGraph.getAllVertices());
		cro3.add(3);
		cro1.remove(1);

		obj2.merge(obj1.hashGraph.getAllVertices());
		cro2.add(2);
		cro1.remove(3);
		cro2.remove(1);

		obj1.merge(obj2.hashGraph.getAllVertices());
		obj1.merge(obj3.hashGraph.getAllVertices());
		obj2.merge(obj1.hashGraph.getAllVertices());
		obj2.merge(obj3.hashGraph.getAllVertices());
		obj3.merge(obj1.hashGraph.getAllVertices());
		obj3.merge(obj2.hashGraph.getAllVertices());

		expect(cro1.contains(1)).toBe(false);
		expect(cro1.contains(2)).toBe(true);
		expect(cro1.contains(3)).toBe(true);
		expect(obj1.hashGraph.vertices).toEqual(obj2.hashGraph.vertices);
		expect(obj1.hashGraph.vertices).toEqual(obj3.hashGraph.vertices);

		const linearOps = obj1.hashGraph.linearizeOperations();
		expect(linearOps).toEqual([
			{ type: "add", value: 1 },
			{ type: "remove", value: 2 },
			{ type: "add", value: 1 },
			{ type: "remove", value: 2 },
			{ type: "add", value: 3 },
			{ type: "remove", value: 1 },
			{ type: "add", value: 2 },
			{ type: "remove", value: 1 },
		]);
	});

	test("Test: Joao's latest brain teaser", () => {
		/*
                 __ V2:Add(2) <------------\
      V1:Add(1) /                           \ - V5:RM(2)
                \__ V3:RM(2) <- V4:RM(2) <--/
    */

		const cro1 = obj1.cro as AddWinsSet<number>;
		const cro2 = obj2.cro as AddWinsSet<number>;

		cro1.add(1);
		obj2.merge(obj1.hashGraph.getAllVertices());

		cro1.add(2);
		cro2.remove(2);
		cro2.remove(2);
		obj1.merge(obj2.hashGraph.getAllVertices());
		obj2.merge(obj1.hashGraph.getAllVertices());

		cro1.remove(2);
		obj2.merge(obj1.hashGraph.getAllVertices());

		expect(cro1.contains(1)).toBe(true);
		expect(cro1.contains(2)).toBe(false);
		expect(obj1.hashGraph.vertices).toEqual(obj2.hashGraph.vertices);

		const linearOps = obj1.hashGraph.linearizeOperations();
		expect(linearOps).toEqual([
			{ type: "add", value: 1 },
			{ type: "add", value: 2 },
			{ type: "remove", value: 2 },
		]);
	});

	test("Test: Giga Chad case", () => {
		/*
	                                           __ V6:ADD(3)
	                                         /
	              ___  V2:ADD(1) <-- V3:RM(2) <-- V7:RM(1) <-- V8:RM(3)
	            /                              ______________/
	  V1:ADD(1)/                              /
	           \                             /
	            \ ___  V4:RM(2) <-- V5:ADD(2) <-- V9:RM(1)
	*/

		const cro4 = obj4.cro as PseudoRandomWinsSet<number>;
		const cro5 = obj5.cro as PseudoRandomWinsSet<number>;
		const cro6 = obj6.cro as PseudoRandomWinsSet<number>;

		cro4.add(1);
		merge(obj5, obj4.hashGraph.getAllVertices());

		cro4.add(1);
		cro4.remove(2);
		cro5.remove(2);
		cro5.add(2);

		merge(obj6, obj4.hashGraph.getAllVertices());
		cro6.add(3);
		cro4.remove(1);

		merge(obj4, obj5.hashGraph.getAllVertices());
		cro4.remove(3);
		cro5.remove(1);

		merge(obj4, obj5.hashGraph.getAllVertices());
		merge(obj4, obj6.hashGraph.getAllVertices());
		merge(obj5, obj4.hashGraph.getAllVertices());
		merge(obj5, obj6.hashGraph.getAllVertices());
		merge(obj6, obj4.hashGraph.getAllVertices());
		merge(obj6, obj5.hashGraph.getAllVertices());

		expect(obj4.hashGraph.vertices).toEqual(obj5.hashGraph.vertices);
		expect(obj4.hashGraph.vertices).toEqual(obj6.hashGraph.vertices);

		const linearOps = obj4.hashGraph.linearizeOperations();
		/* 
			Resolving conflicts:
			1. V2, V4 => V2 is chosen
			2. V2, V5 => V5 is chosen
			3. V3, V5 => V5 is chosen
			4. V6, V7, V5 => V6 is chosen
			5. V6, V8, V9 => V6 is chosen
			Final order: V1, V6
		*/
		expect(linearOps).toEqual([
			{ type: "add", value: 1 },
			{ type: "add", value: 3 },
		]);
	});

	test("Test: Many concurrent operations", () => {
		/*
					--- V1:ADD(1) 
				   /---- V2:ADD(2)
            V0:Nop -- V3:ADD(3)
				   \---- V4:ADD(4)
				    ---- V5:ADD(5)
        */

		const cro4 = obj4.cro as PseudoRandomWinsSet<number>;
		const cro5 = obj5.cro as PseudoRandomWinsSet<number>;
		const cro6 = obj6.cro as PseudoRandomWinsSet<number>;
		const cro7 = obj7.cro as PseudoRandomWinsSet<number>;
		const cro8 = obj8.cro as PseudoRandomWinsSet<number>;

		cro4.add(1);
		cro5.add(2);
		cro6.add(3);
		cro7.add(4);
		cro8.add(5);

		merge(obj5, obj4.hashGraph.getAllVertices());
		merge(obj6, obj5.hashGraph.getAllVertices());
		merge(obj7, obj6.hashGraph.getAllVertices());
		merge(obj8, obj7.hashGraph.getAllVertices());
		merge(obj4, obj8.hashGraph.getAllVertices());

		const linearOps = obj4.hashGraph.linearizeOperations();
		// Pseudo-randomly chosen operation
		expect(linearOps).toEqual([{ type: "add", value: 4 }]);
	});
});
