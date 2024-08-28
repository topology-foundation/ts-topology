import { Operation, OperationType } from "@topology-foundation/object";
import { beforeEach, describe, expect, test } from "vitest";
import { AddWinsSet } from "../src/cros/AddWinsSet/index.js";

describe("HashGraph for AddWinSet tests", () => {
	let cro: AddWinsSet<number>;
	let op0: Operation<number>;
	let vertexHash0: string;
	const peerId = "peerId0";

	beforeEach(() => {
		cro = new AddWinsSet("peer0");
		op0 = new Operation(OperationType.Nop, 0);
		vertexHash0 = cro.hashGraph.rootHash;
	});

	test("Test: Add Two Vertices", () => {
		/*
              V1:NOP <- V2:ADD(1) <- V2:REMOVE(1)
        */
		const op1: Operation<number> = new Operation(OperationType.Add, 1);
		const deps1: string[] = [vertexHash0];
		const vertexHash1 = cro.hashGraph.addVertex(op1, deps1, peerId);
		let linearOps = cro.hashGraph.linearizeOps();
		expect(linearOps).toEqual([op1]);

		// Add second vertex
		const op2: Operation<number> = new Operation(OperationType.Remove, 1);
		const deps2: string[] = [vertexHash1];
		const vertexHash2 = cro.hashGraph.addVertex(op2, deps2, peerId);
		linearOps = cro.hashGraph.linearizeOps();
		const orderArray = cro.hashGraph.topologicalSort();
		expect(linearOps).toEqual([op1, op2]);
	});

	test("Test: Add Two Concurrent Vertices With Same Value", () => {
		/*
                        _ V2:REMOVE(1)
            V1:ADD(1) /
                      \ _ V3:ADD(1)
        */

		const op1: Operation<number> = new Operation(OperationType.Add, 1);
		const deps1: string[] = [vertexHash0];
		const vertexHash1 = cro.hashGraph.addVertex(op1, deps1, peerId);

		let linearOps = cro.hashGraph.linearizeOps();
		expect(linearOps).toEqual([op1]);

		// Add second vertex
		const op2: Operation<number> = new Operation(OperationType.Remove, 1);
		const deps2: string[] = [vertexHash1];
		const vertexHash2 = cro.hashGraph.addVertex(op2, deps2, peerId);

		linearOps = cro.hashGraph.linearizeOps();
		expect(linearOps).toEqual([op1, op2]);

		// Add the third vertex V3 concurrent with V2
		const op3: Operation<number> = new Operation(OperationType.Add, 1);
		const deps3: string[] = [vertexHash1];
		const vertexHash3 = cro.hashGraph.addVertex(op3, deps3, peerId);

		linearOps = cro.hashGraph.linearizeOps();
		expect(linearOps).toEqual([op1, op3]);
	});

	test("Test: Add Two Concurrent Vertices With Different Values", () => {
		/*
                        _ V2:REMOVE(1)
            V1:ADD(1) /
                      \ _ V3:ADD(2)
        */

		const op1: Operation<number> = new Operation(OperationType.Add, 1);
		const deps1: string[] = [vertexHash0];
		const vertexHash1 = cro.hashGraph.addVertex(op1, deps1, peerId);
		let linearOps = cro.hashGraph.linearizeOps();
		expect(linearOps).toEqual([op1]);

		// Add second vertex
		const op2: Operation<number> = new Operation(OperationType.Remove, 1);
		const deps2: string[] = [vertexHash1];
		const vertexHash2 = cro.hashGraph.addVertex(op2, deps2, peerId);
		linearOps = cro.hashGraph.linearizeOps();
		expect(linearOps).toEqual([op1, op2]);

		// Add the third vertex V3 concurrent with V2
		const op3: Operation<number> = new Operation(OperationType.Add, 3);
		const deps3: string[] = [vertexHash1];
		const vertexHash3 = cro.hashGraph.addVertex(op3, deps3, peerId);
		linearOps = cro.hashGraph.linearizeOps();
		expect([
			[op1, op2, op3],
			[op1, op3, op2],
		]).toContainEqual(linearOps);
	});

	test("Test: Tricky Case", () => {
		/*
                        ___  V2:REMOVE(1) <- V4:ADD(10)
            V1:ADD(1) /
                      \ ___  V3:ADD(1) <- V5:REMOVE(5)
        */

		const op1: Operation<number> = new Operation(OperationType.Add, 1);
		const deps1: string[] = [vertexHash0];
		const vertexHash1 = cro.hashGraph.addVertex(op1, deps1, peerId);

		// Add second vertex
		const op2: Operation<number> = new Operation(OperationType.Remove, 1);
		const deps2: string[] = [vertexHash1];
		const vertexHash2 = cro.hashGraph.addVertex(op2, deps2, peerId);

		// Add the third vertex V3 concurrent with V2
		const op3: Operation<number> = new Operation(OperationType.Add, 1);
		const deps3: string[] = [vertexHash1];
		const vertexHash3 = cro.hashGraph.addVertex(op3, deps3, peerId);

		// Add the vertex V4 with dependency on V2
		const op4: Operation<number> = new Operation(OperationType.Add, 10);
		const deps4: string[] = [vertexHash2];
		const vertexHash4 = cro.hashGraph.addVertex(op4, deps4, peerId);

		// Add the vertex V5 with dependency on V3
		const op5: Operation<number> = new Operation(OperationType.Remove, 5);
		const deps5: string[] = [vertexHash3];
		const vertexHash5 = cro.hashGraph.addVertex(op5, deps5, peerId);
		const linearOps = cro.hashGraph.linearizeOps();
		expect([
			[op1, op4, op3, op5],
			[op1, op3, op5, op4],
		]).toContainEqual(linearOps);
	});

	test("Test: Yuta Papa's Case", () => {
		/*
                        ___  V2:REMOVE(1) <- V4:ADD(2)
            V1:ADD(1) /
                      \ ___  V3:REMOVE(2) <- V5:ADD(1)
        */

		const op1: Operation<number> = new Operation(OperationType.Add, 1);
		const deps1: string[] = [vertexHash0];
		const vertexHash1 = cro.hashGraph.addVertex(op1, deps1, peerId);

		// Add second vertex
		const op2: Operation<number> = new Operation(OperationType.Remove, 1);
		const deps2: string[] = [vertexHash1];
		const vertexHash2 = cro.hashGraph.addVertex(op2, deps2, peerId);

		// Add the third vertex V3 concurrent with V2
		const op3: Operation<number> = new Operation(OperationType.Remove, 2);
		const deps3: string[] = [vertexHash1];
		const vertexHash3 = cro.hashGraph.addVertex(op3, deps3, peerId);

		// Add the vertex V4 with dependency on V2
		const op4: Operation<number> = new Operation(OperationType.Add, 2);
		const deps4: string[] = [vertexHash2];
		const vertexHash4 = cro.hashGraph.addVertex(op4, deps4, peerId);

		// Add the vertex V5 with dependency on V3
		const op5: Operation<number> = new Operation(OperationType.Add, 1);
		const deps5: string[] = [vertexHash3];
		const vertexHash5 = cro.hashGraph.addVertex(op5, deps5, peerId);
		const linearOps = cro.hashGraph.linearizeOps();
		expect([
			[op1, op4, op5],
			[op1, op5, op4],
		]).toContainEqual(linearOps);
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

        Topological Sorted Array:
        [V1, V4, V5, V9, V2, V3, V7, V8, V6]
                        OR
        [V1, V2, V3, V6, V7, V4, V5, V8, V9]
                        OR
        [V1, V2, V3, V6, V7, V4, V5, V9, V8]
        */

		const op1: Operation<number> = new Operation(OperationType.Add, 1);
		const deps1: string[] = [vertexHash0];
		const vertexHash1 = cro.hashGraph.addVertex(op1, deps1, peerId);
		console.log("vertex1: ", vertexHash1);
		// Add second vertex
		const op2: Operation<number> = new Operation(OperationType.Add, 1);
		const deps2: string[] = [vertexHash1];
		const vertexHash2 = cro.hashGraph.addVertex(op2, deps2, peerId);
		console.log("vertex2: ", vertexHash2);
		// Add the third vertex V3 with dependency on V2
		const op3: Operation<number> = new Operation(OperationType.Remove, 2);
		const deps3: string[] = [vertexHash2];
		const vertexHash3 = cro.hashGraph.addVertex(op3, deps3, peerId);
		console.log("vertex3: ", vertexHash3);
		// Add the vertex V4 -> [V1]
		const op4: Operation<number> = new Operation(OperationType.Remove, 2);
		const deps4: string[] = [vertexHash1];
		const vertexHash4 = cro.hashGraph.addVertex(op4, deps4, peerId);
		console.log("vertex4: ", vertexHash4);
		// Add the vertex V5 -> [V4]
		const op5: Operation<number> = new Operation(OperationType.Add, 2);
		const deps5: string[] = [vertexHash4];
		const vertexHash5 = cro.hashGraph.addVertex(op5, deps5, peerId);
		console.log("vertex5: ", vertexHash5);
		// Add the vertex V6 ->[V3]
		const op6: Operation<number> = new Operation(OperationType.Add, 3);
		const deps6: string[] = [vertexHash3];
		const vertexHash6 = cro.hashGraph.addVertex(op6, deps6, peerId);
		console.log("vertex6: ", vertexHash6);
		// Add the vertex V7 -> [V3]
		const op7: Operation<number> = new Operation(OperationType.Remove, 1);
		const deps7: string[] = [vertexHash3];
		const vertexHash7 = cro.hashGraph.addVertex(op7, deps7, peerId);
		console.log("vertex7: ", vertexHash7);
		// Add the vertex V8 -> [V7, V5]
		const op8: Operation<number> = new Operation(OperationType.Remove, 3);
		const deps8: string[] = [vertexHash7, vertexHash5];
		const vertexHash8 = cro.hashGraph.addVertex(op8, deps8, peerId);
		console.log("vertex8: ", vertexHash8);
		// Add the vertex V9 -> [V5]
		const op9: Operation<number> = new Operation(OperationType.Remove, 1);
		const deps9: string[] = [vertexHash5];
		const vertexHash9 = cro.hashGraph.addVertex(op9, deps9, peerId);
		console.log("vertex9: ", vertexHash9);

		const sortedOrder = cro.hashGraph.topologicalSort();
		expect([
			[
				vertexHash1,
				vertexHash4,
				vertexHash5,
				vertexHash9,
				vertexHash2,
				vertexHash3,
				vertexHash7,
				vertexHash8,
				vertexHash6,
			],
		]).toContainEqual(sortedOrder);
		console.log(sortedOrder);
		const linearOps = cro.hashGraph.linearizeOps();
		expect([
			[op1, op2, op6, op7, op4, op5],
			[op1, op4, op5, op2, op7, op6],
		]).toContainEqual(linearOps);
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
        6, 7, 8, 3, 2, 9, 5, 4, 1
        Topological Sorted Array:
        [V1, V2, V3, V6, V4, V5, V9, V7, V8]
                      OR
        [V1, V4, V2, V3, V7, V8, V6, V5, V9]
                      OR
        [1, 4, 2, 3, 7, 5, 9, 8, 6]
        */

		const op1: Operation<number> = new Operation(OperationType.Add, 1);
		const deps1: string[] = [vertexHash0];
		const vertexHash1 = cro.hashGraph.addVertex(op1, deps1, peerId);
		console.log("vertex1: ", vertexHash1);
		// Add second vertex
		const op2: Operation<number> = new Operation(OperationType.Add, 1);
		const deps2: string[] = [vertexHash1];
		const vertexHash2 = cro.hashGraph.addVertex(op2, deps2, peerId);
		console.log("vertex2: ", vertexHash2);
		// Add the third vertex V3 with dependency on V2
		const op3: Operation<number> = new Operation(OperationType.Remove, 2);
		const deps3: string[] = [vertexHash2];
		const vertexHash3 = cro.hashGraph.addVertex(op3, deps3, peerId);
		console.log("vertex3: ", vertexHash3);
		// Add the vertex V4 -> [V1]
		const op4: Operation<number> = new Operation(OperationType.Remove, 2);
		const deps4: string[] = [vertexHash1];
		const vertexHash4 = cro.hashGraph.addVertex(op4, deps4, peerId);
		console.log("vertex4: ", vertexHash4);
		// Add the vertex V6 ->[V3]
		const op6: Operation<number> = new Operation(OperationType.Add, 3);
		const deps6: string[] = [vertexHash3];
		const vertexHash6 = cro.hashGraph.addVertex(op6, deps6, peerId);
		console.log("vertex6: ", vertexHash6);
		// Add the vertex V7 -> [V3]
		const op7: Operation<number> = new Operation(OperationType.Remove, 1);
		const deps7: string[] = [vertexHash3];
		const vertexHash7 = cro.hashGraph.addVertex(op7, deps7, peerId);
		console.log("vertex7: ", vertexHash7);
		// Add the vertex V5 -> [V4, V7]
		const op5: Operation<number> = new Operation(OperationType.Add, 2);
		const deps5: string[] = [vertexHash4, vertexHash7];
		const vertexHash5 = cro.hashGraph.addVertex(op5, deps5, peerId);
		console.log("vertex5: ", vertexHash5);
		// Add the vertex V8 -> [V7]
		const op8: Operation<number> = new Operation(OperationType.Remove, 3);
		const deps8: string[] = [vertexHash7, vertexHash5];
		const vertexHash8 = cro.hashGraph.addVertex(op8, deps8, peerId);
		console.log("vertex8: ", vertexHash8);
		// Add the vertex V9 -> [V5]
		const op9: Operation<number> = new Operation(OperationType.Remove, 1);
		const deps9: string[] = [vertexHash5];
		const vertexHash9 = cro.hashGraph.addVertex(op9, deps9, peerId);
		console.log("vertex9: ", vertexHash9);

		const sortedOrder = cro.hashGraph.topologicalSort();
		console.log(sortedOrder);
		// expect([[op0, op1, op2, op3, op6, op4, op5, op9, op7, op8]]).toContainEqual(sortedOrder);
	});

	test("Test: Joao's latest brain teaser", () => {
		/*

                       __ V2:Add(2) <------------\
            V1:Add(1) /                           \ - V5:RM(2)
                      \__ V3:RM(2) <- V4:RM(2) <--/

        */
		const op1: Operation<number> = new Operation(OperationType.Add, 1);
		const deps1: string[] = [vertexHash0];
		const vertexHash1 = cro.hashGraph.addVertex(op1, deps1, peerId);

		// Add the second vertex V2 <- [V1]
		const op2: Operation<number> = new Operation(OperationType.Add, 2);
		const deps2: string[] = [vertexHash1];
		const vertexHash2 = cro.hashGraph.addVertex(op2, deps2, peerId);

		// Add the third vertex V3 <- [V1]
		const op3: Operation<number> = new Operation(OperationType.Remove, 2);
		const deps3: string[] = [vertexHash1];
		const vertexHash3 = cro.hashGraph.addVertex(op3, deps3, peerId);

		// Add the fourth vertex V4 <- [V3]
		const op4: Operation<number> = new Operation(OperationType.Remove, 2);
		const deps4: string[] = [vertexHash3];
		const vertexHash4 = cro.hashGraph.addVertex(op4, deps4, peerId);

		// Add the fifth vertex V5 <- [V2, V4]
		const op5: Operation<number> = new Operation(OperationType.Remove, 2);
		const deps5: string[] = [vertexHash2, vertexHash4];
		const vertexHash5 = cro.hashGraph.addVertex(op5, deps5, peerId);

		const linearOps = cro.hashGraph.linearizeOps();
		expect(linearOps).toEqual([op1, op2, op5]);
	});
});
