import {
	ActionType,
	type HashGraph,
	type Operation,
} from "../hashgraph/index.js";

export function linearizePair(hashGraph: HashGraph): Operation[] {
	const reachableState = hashGraph.topologicalSort();
	const dropped = new Array(reachableState.getLength()).fill(false);
	const result: Operation[] = [];
	let i = 0;

	while (i < reachableState.getLength()) {
		if (dropped[i]) {
			i++;
			continue;
		}
		const anchor = reachableState.getHash(i);
		let j: number = i + 1;

		while (j < reachableState.getLength()) {
			if (dropped[i]) break;
			if (dropped[j]) {
				const nextIndex = reachableState.findNextUnusuallyRelated(anchor, j);
				if (nextIndex === undefined) break;
				j = nextIndex;
				continue;
			}
			const moving = reachableState.getHash(j);

			if (!reachableState.areCausallyRelatedUsingBitsets(anchor, moving)) {
				const v1 = hashGraph.vertices.get(anchor);
				const v2 = hashGraph.vertices.get(moving);
				let action: ActionType;
				if (!v1 || !v2) {
					action = ActionType.Nop;
				} else {
					action = hashGraph.resolveConflicts([v1, v2]).action;
				}

				switch (action) {
					case ActionType.DropLeft:
						dropped[i] = true;
						break;
					case ActionType.DropRight:
						dropped[j] = true;
						break;
					case ActionType.Swap:
						reachableState.swap(i, j);
						j = i;
						break;
					case ActionType.Nop:
						break;
				}
			}

			const nextIndex = reachableState.findNextUnusuallyRelated(anchor, j);
			if (nextIndex === undefined) break;
			j = nextIndex;
		}
		if (dropped[i]) {
			i++;
			continue;
		}

		const op = hashGraph.vertices.get(anchor)?.operation;
		if (op && op.value !== null) result.push(op);
		i++;
	}

	return result;
}
