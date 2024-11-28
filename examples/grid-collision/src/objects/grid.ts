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

	private _computeNewPosition(
		pos: { x: number; y: number },
		direction: string,
	): { x: number; y: number } {
		let deltaY = 0;
		let deltaX = 0;
		switch (direction) {
			case "U":
				deltaY += 1;
				break;
			case "D":
				deltaY -= 1;
				break;
			case "L":
				deltaX -= 1;
				break;
			case "R":
				deltaX += 1;
				break;
		}

		return { x: pos.x + deltaX, y: pos.y + deltaY };
	}

	private _moveUser(userId: string, direction: string): void {
		const userColorString = [...this.positions.keys()].find((u) =>
			u.startsWith(`${userId}:`),
		);
		if (userColorString) {
			const position = this.positions.get(userColorString);
			if (position) {
				const newPos = this._computeNewPosition(position, direction);
				this.positions.set(userColorString, newPos);
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
		// Here we implement compensation for the location.
		// As we operate based on pairwise comparison, there's always only 2 elements.
		// First the vertices must be available, and also not of the same node.
		if (vertices.length === 2 && vertices[0].nodeId !== vertices[1].nodeId) {
			const leftVertex = vertices[0];
			const rightVertex = vertices[1];
			const leftVertexPosition = leftVertex.operation
				? this.getUserPosition(":".concat(leftVertex.operation.value))
				: undefined;
			const rightVertexPosition = rightVertex.operation
				? this.getUserPosition(":".concat(rightVertex.operation.value))
				: undefined;
			console.log(vertices);
			// Let's first handle adding a new user
			if (
				leftVertex.operation?.type === "addUser" &&
				rightVertex.operation?.type === "addUser"
			) {
				// This basically tells the cro to accept only the ones that comes first.
				if (leftVertexPosition) {
					return { action: ActionType.DropRight };
				}
				return { action: ActionType.DropLeft };
			}

			// Now handle moving the user
			if (
				leftVertex.operation?.type === "moveUser" &&
				rightVertex.operation?.type === "moveUser" &&
				leftVertexPosition &&
				rightVertexPosition
			) {
				const leftVertexNextPosition = this._computeNewPosition(
					leftVertexPosition,
					leftVertex.operation.value[1],
				);
				const rightVertexNextPosition = this._computeNewPosition(
					rightVertexPosition,
					rightVertex.operation.value[1],
				);

				// If they are going to colide, do nothing so they don't move and thus do not colide.
				if (
					leftVertexNextPosition.x === rightVertexNextPosition.x &&
					leftVertexNextPosition.y === rightVertexNextPosition.y
				) {
					return { action: ActionType.Drop };
				}
			}
		}

		// If none of the operations match our criteria, they are concurrent
		// safe, and thus we don't need to do anything.
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
