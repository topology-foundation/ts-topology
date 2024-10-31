import { beforeEach, describe, expect, test } from "vitest";
import { AddWinsSet } from "../../blueprints/src/AddWinsSet/index.js";
import { PseudoRandomWinsSet } from "../../blueprints/src/PseudoRandomWinsSet/index.js";
import { type Operation, OperationType, TopologyObject } from "../src/index.js";

describe("HashGraph construction tests", () => {
	let obj1: TopologyObject;
	let obj2: TopologyObject;

	beforeEach(async () => {
		obj1 = new TopologyObject("peer1", new AddWinsSet<number>());
		obj2 = new TopologyObject("peer2", new AddWinsSet<number>());
	});

	test("Test: HashGraph should be DAG compatibility", () => {
		/*		   - V1:ADD(1)
			root /  
				 \ - V2:ADD(2)
		*/
		const cro1 = obj1.cro as AddWinsSet<number>;
		const cro2 = obj2.cro as AddWinsSet<number>;

		cro1.add(1);
		cro2.add(2);

		obj2.merge(obj1.hashGraph.getAllVertices());

		expect(obj2.hashGraph.selfCheckConstraints()).toBe(true);

		const linearOps = obj2.hashGraph.linearizeOperations();
		expect(linearOps).toEqual([
			{ type: "add", value: 1 },
			{ type: "add", value: 2 },
		]);
	});

	test("Test: HashGraph has 2 root vertices", () => {
		/*	
			root - V1:ADD(1)
			fakeRoot - V2:ADD(1)
		*/
		const cro1 = obj1.cro as AddWinsSet<number>;
		cro1.add(1);
		// add fake root
		const hash = obj1.hashGraph.addVertex(
			{
				type: "root",
				value: null,
			},
			[],
			"",
		);
		obj1.hashGraph.addVertex(
			{
				type: "add",
				value: 1,
			},
			[hash],
			"",
		);
		expect(obj1.hashGraph.selfCheckConstraints()).toBe(false);

		const linearOps = obj1.hashGraph.linearizeOperations();
		expect(linearOps).toEqual([{ type: "add", value: 1 }]);
	});
});

describe("HashGraph for AddWinSet tests", () => {
	let obj1: TopologyObject;
	let obj2: TopologyObject;
	let obj3: TopologyObject;

	beforeEach(async () => {
		obj1 = new TopologyObject("peer1", new AddWinsSet<number>());
		obj2 = new TopologyObject("peer2", new AddWinsSet<number>());
		obj3 = new TopologyObject("peer3", new AddWinsSet<number>());
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
});

describe("HashGraph for PseudoRandomWinsSet tests", () => {
	let obj1: TopologyObject;
	let obj2: TopologyObject;
	let obj3: TopologyObject;
	let obj4: TopologyObject;
	let obj5: TopologyObject;

	beforeEach(async () => {
		obj1 = new TopologyObject("peer1", new PseudoRandomWinsSet<number>());
		obj2 = new TopologyObject("peer2", new PseudoRandomWinsSet<number>());
		obj3 = new TopologyObject("peer3", new PseudoRandomWinsSet<number>());
		obj4 = new TopologyObject("peer4", new PseudoRandomWinsSet<number>());
		obj5 = new TopologyObject("peer5", new PseudoRandomWinsSet<number>());
	});

	test("Test: Many concurrent operations", () => {
		/*
					--- V1:ADD(1)
				   /---- V2:ADD(2)
            V0:Nop -- V3:ADD(3)
				   \---- V4:ADD(4)
				    ---- V5:ADD(5)
        */

		const cro1 = obj1.cro as PseudoRandomWinsSet<number>;
		const cro2 = obj2.cro as PseudoRandomWinsSet<number>;
		const cro3 = obj3.cro as PseudoRandomWinsSet<number>;
		const cro4 = obj4.cro as PseudoRandomWinsSet<number>;
		const cro5 = obj5.cro as PseudoRandomWinsSet<number>;

		cro1.add(1);
		cro2.add(2);
		cro3.add(3);
		cro4.add(4);
		cro5.add(5);

		obj2.merge(obj1.hashGraph.getAllVertices());
		obj3.merge(obj2.hashGraph.getAllVertices());
		obj4.merge(obj3.hashGraph.getAllVertices());
		obj5.merge(obj4.hashGraph.getAllVertices());
		obj1.merge(obj5.hashGraph.getAllVertices());

		const linearOps = obj1.hashGraph.linearizeOperations();
		// Pseudo-randomly chosen operation
		expect(linearOps).toEqual([{ type: "add", value: 3 }]);
	});
});

describe("HashGraph for undefined operations tests", () => {
	let obj1: TopologyObject;
	let obj2: TopologyObject;

	beforeEach(async () => {
		obj1 = new TopologyObject("peer1", new AddWinsSet<number>());
		obj2 = new TopologyObject("peer2", new AddWinsSet<number>());
	});

	test("Test: merge should skip undefined operations", () => {
		const cro1 = obj1.cro as AddWinsSet<number>;
		const cro2 = obj2.cro as AddWinsSet<number>;

		cro1.add(1);
		cro2.add(2);

		// Set one of the vertice from cro1 to have undefined operation
		obj1.hashGraph.getAllVertices()[1].operation = undefined;

		obj2.merge(obj1.hashGraph.getAllVertices());

		const linearOps = obj2.hashGraph.linearizeOperations();
		// Should only have one, since we skipped the undefined operations
		expect(linearOps).toEqual([{ type: "add", value: 2 }]);
	});

	test("Test: addToFrontier with undefined operation return Vertex with NoOp operation", () => {
		// Forcefully pass an undefined value
		const createdVertex = obj1.hashGraph.addToFrontier(
			undefined as unknown as Operation,
		);

		expect(createdVertex.operation).toEqual({
			type: OperationType.NOP,
		} as Operation);
	});
});
