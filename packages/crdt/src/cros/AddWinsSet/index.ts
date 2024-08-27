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
	state: Map<T, number>;

	constructor() {
		this.state = new Map<T, number>();
	}

	add(value: T): void {
		if ((this.state.get(value) ?? 0) % 2 === 0) this.state.set(value, 1);
	}

	remove(value: T): void {
		if ((this.state.get(value) ?? 0) % 2 === 1) this.state.set(value, 0);
	}

	contains(value: T): boolean {
		return (this.state.get(value) ?? 0) % 2 === 1;
	}

	values(): T[] {
		return Array.from(this.state.entries())
			.filter(([_, count]) => count === 1)
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

	// merged at HG level and called as a callback
	mergeCallback(operations: Operation<T>[]): void {
		for (const op of operations) {
			switch (op.type) {
				case OperationType.Add:
					if (op.value !== null) this.add(op.value);
					break;
				case OperationType.Remove:
					if (op.value !== null) this.remove(op.value);
					break;
				default:
					break;
			}
		}
	}
}
