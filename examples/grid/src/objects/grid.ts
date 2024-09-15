import {
	type GSet,
	type GMap,
	type PNCounter,
	gset_create,
	gmap_create,
	pncounter_create,
    gcounter_create,
} from "@topology-foundation/crdt";
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
	positions: GMap<string, { x: PNCounter, y: PNCounter }>;

	constructor() {
		this.positions = gmap_create<string, { x: PNCounter, y: PNCounter }>();
	}

	addUser(userId: string, color: string): void {
		const userColorString = `${userId}:${color}`;
		this.positions.add(userColorString, {
			x: pncounter_create(gcounter_create({userId: 0}), gcounter_create({userId: 0})),
			y: pncounter_create(gcounter_create({userId: 0}), gcounter_create({userId: 0}))
		});
	}

	moveUser(userId: string, direction: string): void {
		const userColorString = [...this.positions.map.keys()].find(u => u.startsWith(`${userId}:`));
		if (userColorString) {
			const position = this.positions.get(userColorString);
			if (position) {
				switch (direction) {
					case "U":
						position.y.increment(userId, 1);
						break;
					case "D":
						position.y.increment(userId, -1);
						break;
					case "L":
						position.x.increment(userId, -1);
						break;
					case "R":
						position.x.increment(userId, 1);
						break;
				}
			}
		}
	}

	getUsers(): string[] {
		return [...this.positions.map.keys()];
	}

	getUserPosition(userColorString: string): { x: number, y: number } | undefined {
		const position = this.positions.get(userColorString);
		if (position) {
			return { x: position.x.value(), y: position.y.value() };
		}
		return undefined;
	}

	merge(other: Grid): void {
		for (const [key, value] of other.positions.map) {
			if (!this.positions.has(key)) {
				this.positions.add(key, value);
			} else {
				const currentPosition = this.positions.get(key);
				if (currentPosition) {
					currentPosition.x.merge(value.x);
					currentPosition.y.merge(value.y);
				}
			}
		}
	}

	resolveConflicts(vertices: Vertex[]): ResolveConflictsType {
		return { action: ActionType.Nop };
	}

	mergeCallback(operations: Operation[]): void {}
}

export function createGrid(): Grid {
	return new Grid();
}
