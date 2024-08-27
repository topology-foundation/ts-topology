import {
	ActionType,
	type CRO,
	type Operation,
	type Vertex,
} from "@topology-foundation/object";

enum OperationType {
	Add = 0,
	Remove = 1,
	Nop = 2,
}

/// AddWinsSet with support for state and op changes
export class AddWinsSet<T> implements CRO<T> {
	operations: Operation<T>[];
	state: Map<T, number>;

	constructor() {
		this.operations = [];
		this.state = new Map<T, number>();
	}

	add(value: T): void {
		const op: Operation<T> = { type: OperationType.Add, value };
		this.operations.push(op);
		this.state.set(value, (this.state.get(value) || 0) + 1);
	}

	remove(value: T): void {
		const op: Operation<T> = { type: OperationType.Remove, value };
		this.operations.push(op);
		this.add(value);
	}

	list(): T[] {
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

	// in this case is an array of length 2
	resolveConflicts(vertices: Vertex<T>[]): ActionType {
		if (
			vertices[0].operation.type !== vertices[1].operation.type &&
			vertices[0].operation.value === vertices[1].operation.value
		) {
			return vertices[0].operation.type === OperationType.Add
				? ActionType.DropRight
				: ActionType.DropLeft;
		}
		return ActionType.Nop;
	}

	merge(other: AddWinsSet<T>): void {
		for (const [value, count] of other.state) {
			this.state.set(value, Math.max(this.getValue(value), count));
		}
	}
}
