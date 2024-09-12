import {
	ActionType,
	type HashGraph,
	type Operation,
} from "../hashgraph/index.js";

export function linearizePairWise(hashGraph: HashGraph): Operation[] {
	const order = hashGraph.topologicalSort(true);
	const result: Operation[] = [];
	let i = 0;

	while (i < order.length) {
		const anchor = order[i];
		let j = i + 1;
		let shouldIncrementI = true;

		while (j < order.length) {
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
						order.splice(i, 1);
						j = order.length; // Break out of inner loop
						shouldIncrementI = false;
						continue; // Continue outer loop without incrementing i
					case ActionType.DropRight:
						order.splice(j, 1);
						continue; // Continue with the same j
					case ActionType.Swap:
						[order[i], order[j]] = [order[j], order[i]];
						j = order.length; // Break out of inner loop
						break;
					case ActionType.Nop:
						j++;
						break;
				}
			} else {
				j++;
			}
		}

		if (shouldIncrementI) {
			const op = hashGraph.vertices.get(order[i])?.operation;
			if (op && op.value !== null) result.push(op);
			i++;
		}
	}

	return result;
}
