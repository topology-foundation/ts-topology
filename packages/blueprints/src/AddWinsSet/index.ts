import {
	ActionType,
	type CRO,
	type Operation,
	type ResolveConflictsType,
	SemanticsType,
	type Vertex,
} from "@topology-foundation/object";
import { ACL } from "../AccessControlList/index.js";

export class AddWinsSet<T> implements CRO {
	operations: string[] = ["add", "remove", "grant", "revoke"];
	state: Map<T, boolean>;
	semanticsType = SemanticsType.pair;
	accessControlList: ACL;

	constructor(nodeIds?: string[] | undefined) {
		this.state = new Map<T, boolean>();
		this.accessControlList = new ACL(nodeIds);
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
			const vertex0Type =
				vertices[0].operation.type === "add" ||
				vertices[0].operation.type === "remove";
			const vertex1Type =
				vertices[1].operation.type === "add" ||
				vertices[1].operation.type === "remove";

			if (vertex0Type !== vertex1Type) {
				return { action: ActionType.Nop };
			}

			if (vertex0Type) {
				return vertices[0].operation.type === "add"
					? { action: ActionType.DropRight }
					: { action: ActionType.DropLeft };
			}

			return this.accessControlList.resolveConflicts(vertices);
		}
		return { action: ActionType.Nop };
	}

	// merged at HG level and called as a callback
	mergeCallback(operations: Operation[]): void {
		this.state = new Map<T, boolean>();
		const aclOperations: Operation[] = [];
		for (const op of operations) {
			switch (op.type) {
				case "add":
					if (op.value !== null) this._add(op.value);
					break;
				case "remove":
					if (op.value !== null) this._remove(op.value);
					break;
				case "grant":
					aclOperations.push(op);
					break;
				case "revoke":
					aclOperations.push(op);
					break;
				default:
					break;
			}
		}

		this.accessControlList.mergeCallback(aclOperations);
	}
}
