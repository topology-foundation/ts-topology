import {
	ActionType,
	type CRO,
	type Operation,
	type ResolveConflictsType,
	SemanticsType,
	type Vertex,
} from "@topology-foundation/object";

export class SetOfIntegers implements CRO {
	operations: string[] = ["add"];
	semanticsType: SemanticsType = SemanticsType.pair;
	values: Set<number>;
	constructor() {
		this.values = new Set<number>();
	}

	add(value: number): void {
		this._add(value);
	}

	private _add(value: number): void {
		this.values.add(value);
	}

	getValues(): Set<number> {
		return this.values;
	}

	resolveConflicts(vertices: Vertex[]): ResolveConflictsType {
		return { action: ActionType.Nop };
	}

	mergeCallback(operations: Operation[]): void {
		for (const op of operations) {
			this._add(op.value);
		}
	}
}
