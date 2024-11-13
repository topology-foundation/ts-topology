import {
	ActionType,
	type CRO,
	type Operation,
	type ResolveConflictsType,
	SemanticsType,
	type Vertex,
} from "@topology-foundation/object";
import { Role } from "../constants.js";

export class AddWinsSet<T> implements CRO {
	operations: string[] = ["add", "remove"];
	state: Map<T, boolean>;
	roles: Map<string, number>;
	semanticsType = SemanticsType.pair;

	constructor(nodeIds: string[] | undefined) {
		this.state = new Map<T, boolean>();
		this.roles = new Map<string, number>();
		for (const nodeId of nodeIds || []) {
			this.roles.set(nodeId, Role.ADMIN);
		}
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

	// merged at HG level and called as a callback
	mergeCallback(operations: Operation[]): void {
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

	hasRole(nodeId: string, role: number): boolean {
		if (!this.roles.has(nodeId)) {
			return false;
		}
		return this.roles.get(nodeId) === role;
	}

	grantRole(nodeId: string): void {
		if (!this.roles.has(nodeId) || this.roles.get(nodeId) === Role.NONE) {
			this.roles.set(nodeId, Role.GUEST);
		}
	}

	revokeRole(nodeId: string): void {
		if (this.roles.has(nodeId)) {
			this.roles.set(nodeId, Role.NONE);
		}
	}
}
