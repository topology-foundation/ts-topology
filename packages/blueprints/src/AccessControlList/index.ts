import {
	ActionType,
	type CRO,
	type Operation,
	type ResolveConflictsType,
	Role,
	SemanticsType,
	type Vertex,
} from "@topology-foundation/object";

export class ACL implements CRO {
	operations: string[] = ["grant", "revoke"];
	roles: Map<string, number>;
	semanticsType = SemanticsType.pair;

	constructor(nodeIds?: string[] | undefined) {
		this.roles = new Map<string, Role>();
		if (nodeIds) {
			for (const nodeId of nodeIds) {
				this.roles.set(nodeId, Role.ADMIN);
			}
		}
	}

	private _grant(nodeId: string): void {
		if (!this.roles.get(nodeId) || this.roles.get(nodeId) === Role.NONE) {
			this.roles.set(nodeId, Role.ADMIN);
		}
	}

	grant(nodeId: string): void {
		this._grant(nodeId);
	}

	private _revoke(nodeId: string): void {
		if (this.roles.get(nodeId) && this.roles.get(nodeId) !== Role.ADMIN) {
			this.roles.set(nodeId, Role.NONE);
		}
	}

	revoke(nodeId: string): void {
		this._revoke(nodeId);
	}

	hasRole(nodeId: string, role: number): boolean {
		return this.roles.get(nodeId) === role;
	}

	getNodesWithWritePermission(): string[] {
		return Array.from(this.roles.entries())
			.filter(([_, role]) => role !== Role.NONE)
			.map(([value, _]) => value);
	}

	getNodesWithAdminPermission(): string[] {
		return Array.from(this.roles.entries())
			.filter(([_, role]) => role === Role.ADMIN)
			.map(([value, _]) => value);
	}

	resolveConflicts(vertices: Vertex[]): ResolveConflictsType {
		if (
			vertices[0].operation &&
			vertices[1].operation &&
			vertices[0].operation?.type !== vertices[1].operation?.type &&
			vertices[0].operation?.value === vertices[1].operation?.value
		) {
			return vertices[0].operation.type === "revoke"
				? { action: ActionType.DropRight }
				: { action: ActionType.DropLeft };
		}
		return { action: ActionType.Nop };
	}

	mergeCallback(operations: Operation[]): void {
		const adminNodeIds = this.getNodesWithAdminPermission();
		this.roles = new Map<string, Role>();
		for (const nodeId of adminNodeIds) {
			this.roles.set(nodeId, Role.ADMIN);
		}

		for (const op of operations) {
			switch (op.type) {
				case "grant":
					if (op.value !== null) this._grant(op.value);
					break;
				case "revoke":
					if (op.value !== null) this._revoke(op.value);
					break;
				default:
					break;
			}
		}
	}
}
