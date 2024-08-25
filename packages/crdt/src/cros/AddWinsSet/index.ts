import { ActionType, HashGraph, Operation, OperationType } from "@topology-foundation/object";

/// AddWinsSet with support for state and op changes
export class AddWinsSet<T extends number> {
    state: Map<T, number>;
    hashGraph: HashGraph<T>;

    constructor(nodeId: string) {
        this.state = new Map<T, number>();
        this.hashGraph = new HashGraph<T>(this.resolveConflicts, nodeId);
    }

    resolveConflicts(op1: Operation<T>, op2: Operation<T>): ActionType {
        if (op1.type !== op2.type && op1.value === op2.value) {
            return op1.type === OperationType.Add ? ActionType.DropRight : ActionType.DropLeft;
        }
        return ActionType.Nop;
    }

    add(value: T): void {
        const op = new Operation(OperationType.Add, value);
        this.state.set(value, (this.state.get(value) || 0) + 1);
    }

    remove(value: T): void {
        const op = new Operation(OperationType.Remove, value);
        this.add(value);
    }

    getValue(value: T): number {
      return this.state.get(value) || 0;
    }

    isInSet(value: T): boolean {
      const count = this.getValue(value);
      return count > 0 && count % 2 === 1;
    }

    values(): T[] {
      return Array.from(this.state.entries())
        .filter(([_, count]) => count % 2 === 1)
        .map(([value, _]) => value);
    }

    merge(other: AddWinsSet<T>): void {
      for (const [value, count] of other.state) {
        this.state.set(value, Math.max(this.getValue(value), count));
      }
    }

    read(): T[] {
        const operations = this.hashGraph.linearizeOps();
        const tempCounter = new AddWinsSet<T>("");

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
