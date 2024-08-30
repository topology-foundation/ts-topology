import {
	ActionType,
	type HashGraph,
	type Operation,
	type Hash,
	type Vertex,
} from "../hashgraph.js";

export function linearizeMultiVertex<T>(
	hashGraph: HashGraph<T>,
): Operation<T>[] {
	let order = hashGraph.topologicalSort();
	const indices: Map<Hash, number> = new Map();
	const result: Operation<T>[] = [];
	let i = 0;

	while (i < order.length) {
		const anchor = order[i];
		let j = i + 1;
		let shouldIncrementI = true;

		while (j < order.length) {
			const moving = order[j];

			if (!hashGraph.areCausallyRelated(anchor, moving)) {
				const concurrentOps: Hash[] = [];
				concurrentOps.push(anchor);
				indices.set(anchor, i);
				concurrentOps.push(moving);
				indices.set(moving, j);
				let k = j + 1;
				for (; k < order.length; k++) {
					let add = true;
					for (const hash of concurrentOps) {
						if (hashGraph.areCausallyRelated(hash, order[k])) {
							add = false;
							break;
						}
					}
					if (add) {
						concurrentOps.push(order[k]);
						indices.set(order[k], k);
					}
				}
				const resolved = hashGraph.resolveConflicts(
					concurrentOps.map(
						(hash) => hashGraph.vertices.get(hash) as Vertex<T>,
					),
				);

				switch (resolved.action) {
					case ActionType.Reduce: {
						const newOrder = [];
						for (const hash of resolved.vertices || []) {
							if (indices.get(hash) === i) shouldIncrementI = false;
							order[indices.get(hash) || -1] = "";
						}
						for (const val of order) {
							if (val !== "") newOrder.push(val);
						}
						order = newOrder;
						if (!shouldIncrementI) j = order.length; // Break out of inner loop
						break;
					}
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
