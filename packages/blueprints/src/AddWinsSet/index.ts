import {
	ActionType,
	type CRO,
	type CROState,
	type Operation,
	type ResolveConflictsType,
	SemanticsType,
	type Vertex,
} from "@topology-foundation/object";

export class AddWinsSet<T> implements CRO {
	operations: string[] = ["add", "remove"];
	semanticsType = SemanticsType.pair;
	elementsState: Map<T, boolean>;
	states: Map<string, CROState>;

	constructor() {
		this.elementsState = new Map<T, boolean>();
		this.states = new Map<string, CROState>();
	}

	private _add(value: T): void {
		if (!this.elementsState.get(value)) this.elementsState.set(value, true);
	}

	add(value: T): void {
		this._add(value);
	}

	private _remove(value: T): void {
		if (this.elementsState.get(value)) this.elementsState.set(value, false);
	}

	remove(value: T): void {
		this._remove(value);
	}

	contains(value: T): boolean {
		return this.elementsState.get(value) === true;
	}

	values(): T[] {
		return Array.from(this.elementsState.entries())
			.filter(([_, exists]) => exists)
			.map(([value, _]) => value);
	}

	// in this case is an array of length 2 and there are only two possible operations
	resolveConflicts(vertices: Vertex[]): ResolveConflictsType {
		// Both must have operations, if not return no-op
		if (
			vertices[0].operation &&
			vertices[1].operation &&
			vertices[0].operation?.type !== vertices[1].operation?.type &&
			vertices[0].operation?.value === vertices[1].operation?.value
		) {
			return vertices[0].operation.type === "add"
				? { action: ActionType.DropRight }
				: { action: ActionType.DropLeft };
		}
		return { action: ActionType.Nop };
	}

	// merged at HG level and called as a callback
	mergeCallback(operations: Operation[]): void {
		this.elementsState = new Map<T, boolean>();
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
