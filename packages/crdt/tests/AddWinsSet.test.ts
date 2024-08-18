import { describe, test, expect, beforeEach } from "vitest";
import { AddWinsSet } from "../src/builtins/AddWinsSet";
import { ActionType, HashGraph } from "../../object/src/hashgraph";
import { TopologyObject } from "../../object/src";

interface IAddWinsCRO<T extends number> extends TopologyObject {
    addWinsSet: AddWinsSet<T>;
    hashGraph: HashGraph<Operation<T>>;
    add(element: T): void;
    remove(element: T): void;
    resolveConflicts(op1: Operation<T>, op2: Operation<T>): ActionType;
}

enum OperationType {
    Add,
    Remove
}

class Operation<T> {
    constructor(
        public readonly type: OperationType,
        public readonly value: T
    ) { }
}


class AddWinsCRO<T extends number> extends TopologyObject implements IAddWinsCRO<T, O> {
    addWinsSet: AddWinsSet<T>;
    hashGraph: HashGraph<Operation<T>>;

    constructor(peerId: string) {
        super(peerId);
        this.addWinsSet = new AddWinsSet<T>();
        this.hashGraph = new HashGraph<Operation<T>>(this.resolveConflicts);
    }

    resolveConflicts(op1: Operation<T>, op2: Operation<T>): ActionType {
        if (op1.type !== op2.type && op1.value === op2.value) {
            return op1.type === OperationType.Add ? ActionType.DropRight : ActionType.DropLeft;
        }
        return ActionType.Nop;
    }

    add(value: T): void {
        const op = new Operation(OperationType.Add, value);
        this.addWinsSet.add(value);
        this.hashGraph.addVertex(op, this.hashGraph.getFrontier());
    }

    remove(value: T): void {
        const op = new Operation(OperationType.Remove, value);
        this.addWinsSet.remove(value);
        this.hashGraph.addVertex(op, this.hashGraph.getFrontier());
    }

    merge(other: TopologyObject): void {

    }

    read(): T[] {
        const operations = this.hashGraph.linearizeOps();
        const tempCounter = new AddWinsSet<T>();

        for (const op of operations) {
            if (op.type === OperationType.Add) {
                tempCounter.add(op.value);
            } else {
                tempCounter.remove(op.value);
            }
        }

        return tempCounter.values();

    }
}

describe("HashGraph for AddWinSet tests", () => {
    let cro: AddWinsCRO<number>;

    beforeEach(() => {
        cro = new AddWinsCRO("peer0");
    });

    test("Test: Add Two Vertices", () => {

        /*
              V1:ADD(1) <- V2:REMOVE(1)
        */
        let op1: Operation<number> = new Operation(OperationType.Add, 1);
        let deps1: string[] = [];
        let vertexHash1 = cro.hashGraph.addVertex(op1, deps1);
        let linearOps = cro.hashGraph.linearizeOps();
        expect(linearOps).toEqual([op1]);

        // Add second vertex
        let op2: Operation<number> = new Operation(OperationType.Remove, 1);
        let deps2: string[] = [vertexHash1];
        let vertexHash2 = cro.hashGraph.addVertex(op2, deps2);
        linearOps = cro.hashGraph.linearizeOps();
        let orderArray = cro.hashGraph.topologicalSort();
        expect(linearOps).toEqual([op1, op2]);
    });

    test("Test: Add Two Concurrent Vertices With Same Value", () => {
        /*
                        _ V2:REMOVE(1)
            V1:ADD(1) /
                      \ _ V3:ADD(1)
        */

        let op1: Operation<number> = new Operation(OperationType.Add, 1);;
        let deps1: string[] = [];
        let vertexHash1 = cro.hashGraph.addVertex(op1, deps1);

        let linearOps = cro.hashGraph.linearizeOps();
        expect(linearOps).toEqual([op1]);

        // Add second vertex
        let op2: Operation<number> = new Operation(OperationType.Remove, 1);
        let deps2: string[] = [vertexHash1];
        let vertexHash2 = cro.hashGraph.addVertex(op2, deps2);

        linearOps = cro.hashGraph.linearizeOps();
        expect(linearOps).toEqual([op1, op2]);

        // Add the third vertex V3 concurrent with V2
        let op3: Operation<number> = new Operation(OperationType.Add, 1);
        let deps3: string[] = [vertexHash1];
        let vertexHash3 = cro.hashGraph.addVertex(op3, deps3);

        linearOps = cro.hashGraph.linearizeOps();
        expect(linearOps).toEqual([op1, op3]);
    });

    test("Test: Add Two Concurrent Vertices With Different Values", () => {
        /*
                        _ V2:REMOVE(1)
            V1:ADD(1) /
                      \ _ V3:ADD(2)
        */

        let op1: Operation<number> = new Operation(OperationType.Add, 1);
        let deps1: string[] = [];
        let vertexHash1 = cro.hashGraph.addVertex(op1, deps1);
        let linearOps = cro.hashGraph.linearizeOps();
        expect(linearOps).toEqual([op1]);

        // Add second vertex
        let op2: Operation<number> = new Operation(OperationType.Remove, 1);
        let deps2: string[] = [vertexHash1];
        let vertexHash2 = cro.hashGraph.addVertex(op2, deps2);
        linearOps = cro.hashGraph.linearizeOps();
        expect(linearOps).toEqual([op1, op2]);

        // Add the third vertex V3 concurrent with V2
        let op3: Operation<number> = new Operation(OperationType.Add, 3);
        let deps3: string[] = [vertexHash1];
        let vertexHash3 = cro.hashGraph.addVertex(op3, deps3);
        linearOps = cro.hashGraph.linearizeOps();
        expect([[op1, op2, op3], [op1, op3, op2]]).toContainEqual(linearOps);
    });

    test("Test: Tricky Case", () => {
        /*
                        ___  V2:REMOVE(1) <- V4:ADD(10)
            V1:ADD(1) /                 
                      \ ___  V3:ADD(1) <- V5:REMOVE(5)
        */

        let op1: Operation<number> = new Operation(OperationType.Add, 1);
        let deps1: string[] = [];
        let vertexHash1 = cro.hashGraph.addVertex(op1, deps1);

        // Add second vertex
        let op2: Operation<number> = new Operation(OperationType.Remove, 1);
        let deps2: string[] = [vertexHash1];
        let vertexHash2 = cro.hashGraph.addVertex(op2, deps2);

        // Add the third vertex V3 concurrent with V2
        let op3: Operation<number> = new Operation(OperationType.Add, 1);
        let deps3: string[] = [vertexHash1];
        let vertexHash3 = cro.hashGraph.addVertex(op3, deps3);

        // Add the vertex V4 with dependency on V2
        let op4: Operation<number> = new Operation(OperationType.Add, 10);
        let deps4: string[] = [vertexHash2];
        let vertexHash4 = cro.hashGraph.addVertex(op4, deps4);

        // Add the vertex V5 with dependency on V3
        let op5: Operation<number> = new Operation(OperationType.Remove, 5);
        let deps5: string[] = [vertexHash3];
        let vertexHash5 = cro.hashGraph.addVertex(op5, deps5);
        const linearOps = cro.hashGraph.linearizeOps();
        expect([[op1, op4, op3, op5], [op1, op3, op5, op4]]).toContainEqual(linearOps);

    });

    test("Test: Yuta Papa's Case", () => {
        /*
                        ___  V2:REMOVE(1) <- V4:ADD(2)
            V1:ADD(1) /                 
                      \ ___  V3:REMOVE(2) <- V5:ADD(1)
        */

        let op1: Operation<number> = new Operation(OperationType.Add, 1);
        let deps1: string[] = [];
        let vertexHash1 = cro.hashGraph.addVertex(op1, deps1);

        // Add second vertex
        let op2: Operation<number> = new Operation(OperationType.Remove, 1);
        let deps2: string[] = [vertexHash1];
        let vertexHash2 = cro.hashGraph.addVertex(op2, deps2);


        // Add the third vertex V3 concurrent with V2
        let op3: Operation<number> = new Operation(OperationType.Remove, 2);
        let deps3: string[] = [vertexHash1];
        let vertexHash3 = cro.hashGraph.addVertex(op3, deps3);

        // Add the vertex V4 with dependency on V2
        let op4: Operation<number> = new Operation(OperationType.Add, 2);
        let deps4: string[] = [vertexHash2];
        let vertexHash4 = cro.hashGraph.addVertex(op4, deps4);

        // Add the vertex V5 with dependency on V3
        let op5: Operation<number> = new Operation(OperationType.Add, 1);
        let deps5: string[] = [vertexHash3];
        let vertexHash5 = cro.hashGraph.addVertex(op5, deps5);
        const linearOps = cro.hashGraph.linearizeOps();
        expect([[op1, op4, op5], [op1, op5, op4]]).toContainEqual(linearOps);
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

        let op1: Operation<number> = new Operation(OperationType.Add, 1);
        let deps1: string[] = [];
        let vertexHash1 = cro.hashGraph.addVertex(op1, deps1);
        // Add second vertex
        let op2: Operation<number> = new Operation(OperationType.Add, 1);
        let deps2: string[] = [vertexHash1];
        let vertexHash2 = cro.hashGraph.addVertex(op2, deps2);
        // Add the third vertex V3 concurrent with V2
        let op3: Operation<number> = new Operation(OperationType.Remove, 2);
        let deps3: string[] = [vertexHash2];
        let vertexHash3 = cro.hashGraph.addVertex(op3, deps3);
        // Add the vertex V4 with dependency on V2
        let op4: Operation<number> = new Operation(OperationType.Remove, 2);
        let deps4: string[] = [vertexHash1];
        let vertexHash4 = cro.hashGraph.addVertex(op4, deps4);
        // Add the vertex V5 -> [V4]
        let op5: Operation<number> = new Operation(OperationType.Add, 2);
        let deps5: string[] = [vertexHash4];
        let vertexHash5 = cro.hashGraph.addVertex(op5, deps5);
        // Add the vertex V6 ->[V3]
        let op6: Operation<number> = new Operation(OperationType.Add, 3);
        let deps6: string[] = [vertexHash3];
        let vertexHash6 = cro.hashGraph.addVertex(op6, deps6);
        // Add the vertex V7 -> [V3]
        let op7: Operation<number> = new Operation(OperationType.Remove, 1);
        let deps7: string[] = [vertexHash3];
        let vertexHash7 = cro.hashGraph.addVertex(op7, deps7);
        // Add the vertex V8 -> [V7, V5]
        let op8: Operation<number> = new Operation(OperationType.Remove, 3);
        let deps8: string[] = [vertexHash7, vertexHash5];
        let vertexHash8 = cro.hashGraph.addVertex(op8, deps8);
        // Add the vertex V9 -> [V5]
        let op9: Operation<number> = new Operation(OperationType.Remove, 1);
        let deps9: string[] = [vertexHash5];
        let vertexHash9 = cro.hashGraph.addVertex(op9, deps9);

        let linearOps = cro.hashGraph.linearizeOps();
        expect([[op1, op2, op6, op7, op4, op5]]).toContainEqual(linearOps);
    });

    test("Test: Jaoa's latest brain teaser", () => {
        /*
            
                       __ V2:Add(2) <------------\
            V1:Add(1) /                           \ - V5:RM(2)
                      \__ V3:RM(2) <- V4:RM(2) <--/

        */
        let op1: Operation<number> = new Operation(OperationType.Add, 1);
        let deps1: string[] = [];
        let vertexHash1 = cro.hashGraph.addVertex(op1, deps1);

        // Add the second vertex V2 <- [V1]
        let op2: Operation<number> = new Operation(OperationType.Add, 2);
        let deps2: string[] = [vertexHash1];
        let vertexHash2 = cro.hashGraph.addVertex(op2, deps2);

        // Add the third vertex V3 <- [V1]
        let op3: Operation<number> = new Operation(OperationType.Remove, 2);
        let deps3: string[] = [vertexHash1];
        let vertexHash3 = cro.hashGraph.addVertex(op3, deps3);

        // Add the fourth vertex V4 <- [V3]
        let op4: Operation<number> = new Operation(OperationType.Remove, 2);
        let deps4: string[] = [vertexHash3];
        let vertexHash4 = cro.hashGraph.addVertex(op4, deps4);

        // Add the fifth vertex V5 <- [V2, V4]
        let op5: Operation<number> = new Operation(OperationType.Remove, 2);
        let deps5: string[] = [vertexHash2, vertexHash4];
        let vertexHash5 = cro.hashGraph.addVertex(op5, deps5);

        const linearOps = cro.hashGraph.linearizeOps();
        expect(linearOps).toEqual([op1, op2, op5]);
    });
});

// V1, V3, V4, V2, V5
// V1, V2, V3, V4, V5
// V1, V3, V2, V4, V5