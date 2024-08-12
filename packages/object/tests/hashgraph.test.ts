import {HashGraphVertex, HashGraphDAG} from '../src/hashgraph';
import {describe, test, expect, beforeEach} from 'vitest';
import { sha256 } from 'js-sha256'
import exp from 'constants';

class AddWinSet {
    state: number;

    constructor(state: number) {
        this.state = state;
    }

    add(value: number) {
        this.state += value;
    }

    delete(value: number) {
        this.state -= value;
    }
}
// Relevant types definition
type Operation = 
     {type: "ADD", value: number}
    | {type: "REMOVE", value: number}
;

type Hash = string;

function resolveConflicts(operations: Operation[]): Operation[] {
    const operationMap = new Map<number, Operation[]>();
  
    // Group operations by their value
    for (const op of operations) {
      if (!operationMap.has(op.value)) {
        operationMap.set(op.value, []);
      }
      operationMap.get(op.value)!.push(op);
    }
  
    return Array.from(operationMap.values()).flatMap(ops => {
      const hasAdd = ops.some(op => op.type === 'ADD');
      const hasRemove = ops.some(op => op.type === 'REMOVE');
  
      return hasAdd && hasRemove ? ops.filter(op => op.type === 'ADD') : ops;
    });
  }

function computeHash(op: Operation, dependencies: string[]): string {
    // Serialize the operation and dependencies
    const serializedOperation = JSON.stringify(op);
    const serializedDependencies = JSON.stringify(dependencies);

    // Concatenate the serialized strings
    const combined = `${serializedOperation}|${serializedDependencies}`;

    // Compute the BLAKE3 hash
    const hashValue = sha256(combined);

    // Return the hash as a hexadecimal string
    return hashValue;
}

describe("HashGraph for AddWinSet tests", () => {
    let crdt: AddWinSet;
    let hashGraph: HashGraphDAG<Operation>

    beforeEach(() => {
        crdt = new AddWinSet(0);
        hashGraph = new HashGraphDAG<Operation>(resolveConflicts);

    });

    test("Test: Add Two Vertices", () => {

        /*
              V1:ADD(1) <- V2:REMOVE(1)
        */
        let op1: Operation = {type: "ADD", value: 1};
        let deps1: string[] = [];
        let vertexHash1 = computeHash(op1, deps1);

        hashGraph.addVertex(vertexHash1, op1, deps1);
        let linearOps = hashGraph.getLinearOps();
        expect(linearOps).toStrictEqual([op1]);
        
        // Add second vertex
        let op2: Operation = {type: "REMOVE", value: 1};
        let deps2: string[] = [vertexHash1];
        let vertexHash2 = computeHash(op2, deps2);

        hashGraph.addVertex(vertexHash2, op2, deps2);
        linearOps = hashGraph.getLinearOps();
        expect(linearOps).toStrictEqual([op1, op2]);
    });

    test("Test: Add Two Concurrent Vertices With Same Value"), () => {
        /*
                        _ V2:REMOVE(1)
            V1:ADD(1) /
                      \ _ V3:ADD(1)
        */

        let op1: Operation = {type: "ADD", value: 1};
        let deps1: string[] = [];
        let vertexHash1 = computeHash(op1, deps1);

        hashGraph.addVertex(vertexHash1, op1, deps1);
        let linearOps = hashGraph.getLinearOps();
        expect(linearOps).toStrictEqual([op1]);
        
        // Add second vertex
        let op2: Operation = {type: "REMOVE", value: 1};
        let deps2: string[] = [vertexHash1];
        let vertexHash2 = computeHash(op2, deps2);

        hashGraph.addVertex(vertexHash2, op2, deps2);
        linearOps = hashGraph.getLinearOps();
        expect(linearOps).toStrictEqual([op1, op2]); 

        // Add the third vertex V3 concurrent with V2
        let op3: Operation = {type: "ADD", value: 1};
        let deps3: string[] = [vertexHash1];
        let vertexHash3 = computeHash(op3, deps3);

        hashGraph.addVertex(vertexHash3, op3, deps3);
        linearOps = hashGraph.getLinearOps();
        expect(linearOps).toStrictEqual([op1]);
    }

    test("Test: Add Two Concurrent Vertices With Different Values"), () => {
        /*
                        _ V2:REMOVE(1)
            V1:ADD(1) /
                      \ _ V3:ADD(2)
        */

        let op1: Operation = {type: "ADD", value: 1};
        let deps1: string[] = [];
        let vertexHash1 = computeHash(op1, deps1);

        hashGraph.addVertex(vertexHash1, op1, deps1);
        let linearOps = hashGraph.getLinearOps();
        expect(linearOps).toStrictEqual([op1]);
        
        // Add second vertex
        let op2: Operation = {type: "REMOVE", value: 1};
        let deps2: string[] = [vertexHash1];
        let vertexHash2 = computeHash(op2, deps2);

        hashGraph.addVertex(vertexHash2, op2, deps2);
        linearOps = hashGraph.getLinearOps();
        expect(linearOps).toStrictEqual([op1, op2]); 

        // Add the third vertex V3 concurrent with V2
        let op3: Operation = {type: "ADD", value: 2};
        let deps3: string[] = [vertexHash1];
        let vertexHash3 = computeHash(op3, deps3);

        hashGraph.addVertex(vertexHash3, op3, deps3);
        linearOps = hashGraph.getLinearOps();
        expect([[op1, op2, op3],[op1, op3, op2]]).includes(linearOps);
    }




});
