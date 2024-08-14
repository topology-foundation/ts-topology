import { describe, test, expect, beforeEach } from "vitest";
import { AddWinsSet } from "../src/builtins/AddWinsSet";
import { HashGraphDAG, HashGraphVertex } from "../../object/src/hashgraph";
import { TopologyObject } from "../../object/src";
import exp from "constants";

interface IAddWinsCRO<T extends number, O> extends TopologyObject {
    addWinsSet: AddWinsSet<T>;
    hashGraph: HashGraphDAG<O>;
    add(element: T): void;
    remove(element: T): void;
    resolveConflicts(ops: O[]): O[]; 
}

// Define a generic Operation interface
interface Operation {
    type: string;  // The type field can be any string
    value: any;    // The value field can be of any type
}

class AddWinsCRO<T extends number, O extends Operation> extends TopologyObject implements IAddWinsCRO<T, O> {
    addWinsSet: AddWinsSet<T>;
    hashGraph: HashGraphDAG<O>;

    constructor(peerId: string) {
        super(peerId);
        this.addWinsSet = new AddWinsSet<T>(new Set<T>(), new Set<T>());
        this.hashGraph = new HashGraphDAG<O>(this.resolveConflicts);
    }

    resolveConflicts(ops: O[]): O[] {
        const operationMap = new Map<number, O[]>();
        // Group operations by their value
        for (const op of ops) {
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

    add(element: T): void {
        this.addWinsSet.add(element);
    }

    remove(element: T): void {
        this.addWinsSet.remove(element);
    }

    merge(other: TopologyObject): void {
        
    }

    read(): T {
        const ops = this.hashGraph.getLinearOps();
        for (const op of ops) {
            switch (op.type) {
                case "ADD": 
                    this.add(op.value);
                    break;
                case "REMOVE":
                    this.remove(op.value)
                    break;
            }
        }
        return this.addWinsSet.read();
    }
}

// define Operation type
type OP = 
     {type: "ADD", value: number}
    | {type: "REMOVE", value: number}
;

describe("HashGraph for AddWinSet tests", () => {
    let cro: AddWinsCRO<number, OP>;

    beforeEach(() => {
        cro = new AddWinsCRO("peer0");
    });

    test("Test: Add Two Vertices", () => {

        /*
              V1:ADD(1) <- V2:REMOVE(1)
        */
        let op1: OP = {type: "ADD", value: 1};
        let deps1: string[] = [];
        let vertexHash1 =    cro.hashGraph.addVertex(op1, deps1);
        let linearOps = cro.hashGraph.getLinearOps();
        expect(linearOps).toEqual([op1]);
        
        // Add second vertex
        let op2: OP = {type: "REMOVE", value: 1};
        let deps2: string[] = [vertexHash1];
        let vertexHash2 = cro.hashGraph.addVertex(op2, deps2);     
        linearOps = cro.hashGraph.getLinearOps();
        expect(linearOps).toEqual([op1, op2]);
    });

    test("Test: Add Two Concurrent Vertices With Same Value"), () => {
        /*
                        _ V2:REMOVE(1)
            V1:ADD(1) /
                      \ _ V3:ADD(1)
        */

        let op1: OP = {type: "ADD", value: 1};
        let deps1: string[] = [];
        let vertexHash1 = cro.hashGraph.addVertex(op1, deps1);

        let linearOps = cro.hashGraph.getLinearOps();
        expect(linearOps).toEqual([op1]);
        
        // Add second vertex
        let op2: OP = {type: "REMOVE", value: 1};
        let deps2: string[] = [vertexHash1];
        let vertexHash2 = cro.hashGraph.addVertex(op2, deps2);

        
        linearOps = cro.hashGraph.getLinearOps();
        expect(linearOps).toEqual([op1, op2]); 

        // Add the third vertex V3 concurrent with V2
        let op3: OP = {type: "ADD", value: 1};
        let deps3: string[] = [vertexHash1];
        let vertexHash3 = cro.hashGraph.addVertex(op3, deps3);

        linearOps = cro.hashGraph.getLinearOps();
        expect(linearOps).toEqual([op1, op2]);

        // the read value should be 2 ,i.e., ADD(1) + (ADD(1) + REMOVE(1)) => ADD(1) + ADD(1) => 1 + 1 => 2
        let readValue = cro.read();
        expect(readValue).toBe(2);
    }

    test("Test: Add Two Concurrent Vertices With Different Values"), () => {
        /*
                        _ V2:REMOVE(1)
            V1:ADD(1) /
                      \ _ V3:ADD(2)
        */

        let op1: OP = {type: "ADD", value: 1};
        let deps1: string[] = [];
        let vertexHash1 =  cro.hashGraph.addVertex(op1, deps1);
        let linearOps = cro.hashGraph.getLinearOps();
        expect(linearOps).toEqual([op1]);
        
        // Add second vertex
        let op2: OP = {type: "REMOVE", value: 1};
        let deps2: string[] = [vertexHash1];
        let vertexHash2 = cro.hashGraph.addVertex(op2, deps2);
        linearOps = cro.hashGraph.getLinearOps();
        expect(linearOps).toEqual([op1, op2]); 

        // Add the third vertex V3 concurrent with V2
        let op3: OP = {type: "ADD", value: 2};
        let deps3: string[] = [vertexHash1];
        let vertexHash3 =   cro.hashGraph.addVertex(op3, deps3);    
        linearOps = cro.hashGraph.getLinearOps();
        expect([[op1, op2, op3],[op1, op3, op2]]).includes(linearOps);

        console.log("Hello")
    }
});