import {
	ActionType,
	type CRO,
	type Operation,
	type ResolveConflictsType,
	SemanticsType,
	type Vertex,
} from "@topology-foundation/object";

export class AddWinsSet<T> implements CRO<T> {
	operations: string[] = ["add", "remove"];
	state: Map<T, boolean>;
	semanticsType = SemanticsType.pairWise;

	constructor() {
		this.state = new Map<T, boolean>();
	}

	private _add(value: T): void {
		if (!this.state.get(value)) this.state.set(value, true);
	}

	add(value: T): void {
		this._add(value);
	}

	private _remove(value: T): void {
		if (this.state.get(value)) this.state.set(value, false);
	}

	remove(value: T): void {
		this._remove(value);
	}

	contains(value: T): boolean {
		return this.state.get(value) === true;
	}

	values(): T[] {
		return Array.from(this.state.entries())
			.filter(([_, exists]) => exists)
			.map(([value, _]) => value);
	}

	// in this case is an array of length 2 and there are only two possible operations
	resolveConflicts(vertices: Vertex<T>[]): ResolveConflictsType {
		if (
			vertices[0].operation.type !== vertices[1].operation.type &&
			vertices[0].operation.value === vertices[1].operation.value
		) {
			return vertices[0].operation.type === "add"
				? { action: ActionType.DropRight }
				: { action: ActionType.DropLeft };
		}
		return { action: ActionType.Nop };
	}

	// merged at HG level and called as a callback
	mergeCallback(operations: Operation<T>[]): void {
		this.state = new Map<T, boolean>();
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
