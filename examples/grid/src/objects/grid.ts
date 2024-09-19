import {
	ActionType,
	type CRO,
	type Operation,
	type ResolveConflictsType,
	SemanticsType,
	type Vertex,
} from "@topology-foundation/object";

export class Grid implements CRO {
	operations: string[] = ["addUser", "moveUser"];
	semanticsType: SemanticsType = SemanticsType.pair;
	positions: Map<string, { x: number; y: number }>;

	constructor() {
		this.positions = new Map<string, { x: number; y: number }>();
	}

	addUser(userId: string, color: string): void {
		this._addUser(userId, color);
	}

	private _addUser(userId: string, color: string): void {
		const userColorString = `${userId}:${color}`;
		this.positions.set(userColorString, { x: 0, y: 0 });
	}

	moveUser(userId: string, direction: string): void {
		this._moveUser(userId, direction);
	}

	private _moveUser(userId: string, direction: string): void {
		const userColorString = [...this.positions.keys()].find((u) =>
			u.startsWith(`${userId}:`),
		);
		if (userColorString) {
			const position = this.positions.get(userColorString);
			if (position) {
				switch (direction) {
					case "U":
						position.y += 1;
						break;
					case "D":
						position.y -= 1;
						break;
					case "L":
						position.x -= 1;
						break;
					case "R":
						position.x += 1;
						break;
				}
			}
		}
	}

	getUsers(): string[] {
		return [...this.positions.keys()];
	}

	getUserPosition(
		userColorString: string,
	): { x: number; y: number } | undefined {
		const position = this.positions.get(userColorString);
		if (position) {
			return position;
		}
		return undefined;
	}

	resolveConflicts(vertices: Vertex[]): ResolveConflictsType {
		return { action: ActionType.Nop };
	}

	mergeCallback(operations: Operation[]): void {
		// reset this.positions
		this.positions = new Map<string, { x: number; y: number }>();

		// apply operations to this.positions
		for (const op of operations) {
			if (!op.value) continue;
			switch (op.type) {
				case "addUser": {
					const [userId, color] = op.value;
					this._addUser(userId, color);
					break;
				}
				case "moveUser": {
					const [userId, direction] = op.value;
					this._moveUser(userId, direction);
					break;
				}
			}
		}
	}
}

export function createGrid(): Grid {
	return new Grid();
}
