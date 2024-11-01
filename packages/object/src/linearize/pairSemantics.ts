import {
	ActionType,
	type HashGraph,
	type Operation,
} from "../hashgraph/index.js";

export function linearizePair(hashGraph: HashGraph): Operation[] {
	const order = hashGraph.topologicalSort(true);
	const dropped = new Array(order.length).fill(false);
	const result: Operation[] = [];
	let i = 0;

	while (i < order.length) {
		if (dropped[i]) {
			i++;
			continue;
		}
		const anchor = order[i];
		let j = i + 1;

		while (j < order.length) {
			if (dropped[i]) break;
			if (dropped[j]) {
				j++;
				continue;
			}
			const moving = order[j];

			if (!hashGraph.areCausallyRelatedUsingBitsets(anchor, moving)) {
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
						[order[i], order[j]] = [order[j], order[i]];
						j = i + 1;
						break;
					case ActionType.Nop:
						j++;
						break;
				}
			} else {
				j++;
			}
		}
		if (dropped[i]) {
			i++;
			continue;
		}

		const op = hashGraph.vertices.get(order[i])?.operation;
		if (op && op.value !== null) result.push(op);
		i++;
	}

	return result;
}
