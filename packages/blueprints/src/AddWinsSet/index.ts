import {
	ActionType,
	type DRP,
	type Operation,
	type ResolveConflictsType,
	SemanticsType,
	type Vertex,
} from "@ts-drp/object";

export class AddWinsSet<T> implements DRP {
	operations: string[] = ["add", "remove"];
	state: Map<T, boolean>;
	semanticsType = SemanticsType.pair;
	// biome-ignore lint: attributes can be anything
	[key: string]: any;

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

	// biome-ignore lint: attributes can be anything
	updateAttribute(key: string, value: any): void {
		if (!(key in this)) {
			throw new Error(`Key '${String(key)}' does not exist in this object.`);
		}
		if (typeof this[key] === "function") {
			throw new Error(`Cannot update method '${key}' using updateState.`);
		}
		this[key] = value;
	}
}
