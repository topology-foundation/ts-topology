import {
	ActionType,
	type CRO,
	type Operation,
	type Vertex,
} from "@topology-foundation/object";

export class AddWinsSet<T> implements CRO<T> {
	operations: string[] = ["add", "remove"];
	state: Map<T, number>;

	constructor() {
		this.state = new Map<T, number>();
	}

	private _add(value: T): void {
		if ((this.state.get(value) ?? 0) % 2 === 0) this.state.set(value, 1);
	}

	add(value: T): void {
		this._add(value);
	}

	private _remove(value: T): void {
		if ((this.state.get(value) ?? 0) % 2 === 1) this.state.set(value, 0);
	}

	remove(value: T): void {
		this._remove(value);
	}

	contains(value: T): boolean {
		return (this.state.get(value) ?? 0) % 2 === 1;
	}

	values(): T[] {
		return Array.from(this.state.entries())
			.filter(([_, count]) => count === 1)
			.map(([value, _]) => value);
	}

	// in this case is an array of length 2 and there are only two possible operations
	resolveConflicts(vertices: Vertex<T>[]): ActionType {
		if (
			vertices[0].operation.type !== vertices[1].operation.type &&
			vertices[0].operation.value === vertices[1].operation.value
		) {
			return vertices[0].operation.type === "add"
				? ActionType.DropRight
				: ActionType.DropLeft;
		}
		return ActionType.Nop;
	}

	// merged at HG level and called as a callback
	mergeCallback(operations: Operation<T>[]): void {
		this.state = new Map<T, number>();
		for (const op of operations) {
			switch (op.type) {
				case "add":
					if (op.value !== null) this._add(op.value);
					break;
				case "remove":
					if (op.value !== null) this._remove(op.value);
					break;
				default:
					break;
			}
		}
	}
}
