import { Operation, OperationType } from "@topology-foundation/object/";
import { beforeEach, describe, expect, test } from "vitest";
import { ReduceActionType } from "../src/cros/ReduceActionType/index.js";

describe("Reduce Action Type tests", () => {
	let cro: ReduceActionType<number>;
	let op0: Operation<number>;
	let vertexHash0: string;
	const peerId = "peerId0";

	beforeEach(() => {
		cro = new ReduceActionType("peer0");
		op0 = new Operation(OperationType.Nop, 0);
		vertexHash0 = cro.hashGraph.rootHash;
	});

	test("Test: Giga Chad Case", () => {
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
		// Add second vertex
		const op2: Operation<number> = new Operation(OperationType.Add, 1);
		const deps2: string[] = [vertexHash1];
		const vertexHash2 = cro.hashGraph.addVertex(op2, deps2, peerId);
		// Add the third vertex V3 with dependency on V2
		const op3: Operation<number> = new Operation(OperationType.Remove, 2);
		const deps3: string[] = [vertexHash2];
		const vertexHash3 = cro.hashGraph.addVertex(op3, deps3, peerId);
		// Add the vertex V4 -> [V1]
		const op4: Operation<number> = new Operation(OperationType.Remove, 2);
		const deps4: string[] = [vertexHash1];
		const vertexHash4 = cro.hashGraph.addVertex(op4, deps4, peerId);
		// Add the vertex V5 -> [V4]
		const op5: Operation<number> = new Operation(OperationType.Add, 2);
		const deps5: string[] = [vertexHash4];
		const vertexHash5 = cro.hashGraph.addVertex(op5, deps5, peerId);
		// Add the vertex V6 ->[V3]
		const op6: Operation<number> = new Operation(OperationType.Add, 3);
		const deps6: string[] = [vertexHash3];
		const vertexHash6 = cro.hashGraph.addVertex(op6, deps6, peerId);
		// Add the vertex V7 -> [V3]
		const op7: Operation<number> = new Operation(OperationType.Remove, 1);
		const deps7: string[] = [vertexHash3];
		const vertexHash7 = cro.hashGraph.addVertex(op7, deps7, peerId);
		// Add the vertex V8 -> [V7, V5]
		const op8: Operation<number> = new Operation(OperationType.Remove, 3);
		const deps8: string[] = [vertexHash7, vertexHash5];
		const vertexHash8 = cro.hashGraph.addVertex(op8, deps8, peerId);
		// Add the vertex V9 -> [V5]
		const op9: Operation<number> = new Operation(OperationType.Remove, 1);
		const deps9: string[] = [vertexHash5];
		const vertexHash9 = cro.hashGraph.addVertex(op9, deps9, peerId);

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
		const linearOps = cro.linearizeOps();
		expect([[op1, op5, op8]]).toContainEqual(linearOps);
	});

	test("Test: Many concurrent operations", () => {
		/*
					--- V1:ADD(1) 
				   /---- V2:ADD(2)
            V0:Nop -- V3:ADD(3)
				   \---- V4:ADD(4)
				    \--- V5:ADD(5)
        */
		const op1: Operation<number> = new Operation(OperationType.Add, 1);
		const deps1: string[] = [vertexHash0];
		const vertexHash1 = cro.hashGraph.addVertex(op1, deps1, peerId);

		const op2: Operation<number> = new Operation(OperationType.Add, 2);
		const deps2: string[] = [vertexHash0];
		const vertexHash2 = cro.hashGraph.addVertex(op2, deps2, peerId);

		const op3: Operation<number> = new Operation(OperationType.Add, 3);
		const deps3: string[] = [vertexHash0];
		const vertexHash3 = cro.hashGraph.addVertex(op3, deps3, peerId);

		const op4: Operation<number> = new Operation(OperationType.Add, 4);
		const deps4: string[] = [vertexHash0];
		const vertexHash4 = cro.hashGraph.addVertex(op4, deps4, peerId);

		const op5: Operation<number> = new Operation(OperationType.Add, 5);
		const deps5: string[] = [vertexHash0];
		const vertexHash5 = cro.hashGraph.addVertex(op5, deps5, peerId);

		const linearOps = cro.linearizeOps();
		expect(linearOps).toEqual([op1]);
	});
});
