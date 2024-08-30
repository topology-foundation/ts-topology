import { type HashGraph, ActionType, type Operation } from "../hashgraph.js";

export function linearizePairWise<T>(hashGraph: HashGraph<T>): Operation<T>[] {
	const order = hashGraph.topologicalSort();
	const result: Operation<T>[] = [];
	let i = 0;

	while (i < order.length) {
		const anchor = order[i];
		let j = i + 1;
		let shouldIncrementI = true;

		while (j < order.length) {
			const moving = order[j];

			if (!hashGraph.areCausallyRelated(anchor, moving)) {
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
