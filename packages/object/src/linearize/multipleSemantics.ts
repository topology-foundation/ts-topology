import { BitSet } from "../hashgraph/bitset.js";
import {
	ActionType,
	type Hash,
	type HashGraph,
	type Operation,
	type Vertex,
} from "../hashgraph/index.js";

export function linearizeMultiple(hashGraph: HashGraph): Operation[] {
	const order = hashGraph.topologicalSort(true);
	const dropped = new Array(order.length).fill(false);
	const indices: Map<Hash, number> = new Map();
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
			if (dropped[j]) {
				j = hashGraph.findNextUnusuallyRelated(anchor, j) ?? order.length;
				continue;
			}
			const moving = order[j];

			if (!hashGraph.areCausallyRelatedUsingBitsets(anchor, moving)) {
				const concurrentOps: Hash[] = [];
				concurrentOps.push(anchor);
				indices.set(anchor, i);
				concurrentOps.push(moving);
				indices.set(moving, j);
				
				let reachableVertices : BitSet = new BitSet(hashGraph.getCurrentBitsetSize());
				const anchorReachablePredecessors = hashGraph.getReachablePredecessors(anchor);
				if (anchorReachablePredecessors) {
					reachableVertices = reachableVertices.or(anchorReachablePredecessors);
				}
				const movingReachablePredecessors = hashGraph.getReachablePredecessors(moving);
				if (movingReachablePredecessors) {
					reachableVertices = reachableVertices.or(movingReachablePredecessors);
				}

				let k = reachableVertices.findNext(j, 0);
				while (k < order.length) {
					if (dropped[k]) {
						k = reachableVertices.findNext(k, 0);
						continue;
					}

					let add = true;
					for (const hash of concurrentOps) {
						if (hashGraph.areCausallyRelatedUsingBitsets(hash, order[k])) {
							add = false;
							break;
						}
					}
					if (add) {
						concurrentOps.push(order[k]);
						indices.set(order[k], k);
						const reachablePredecessors = hashGraph.getReachablePredecessors(order[k]);
						if (reachablePredecessors) {
							reachableVertices = reachableVertices.or(reachablePredecessors);
						}
					}

					k = reachableVertices.findNext(k, 0);
				}
				const resolved = hashGraph.resolveConflicts(
					concurrentOps.map((hash) => hashGraph.vertices.get(hash) as Vertex),
				);

				switch (resolved.action) {
					case ActionType.Drop: {
						for (const hash of resolved.vertices || []) {
							dropped[indices.get(hash) || -1] = true;
						}
						if (dropped[i]) {
							j = order.length;
						}
						break;
					}
					case ActionType.Nop:
						j = hashGraph.findNextUnusuallyRelated(anchor, j) ?? order.length;
						break;
					default:
						break;
				}
			} else {
				j = hashGraph.findNextUnusuallyRelated(anchor, j) ?? order.length;
			}
		}

		if (!dropped[i]) {
			const op = hashGraph.vertices.get(order[i])?.operation;
			if (op && op.value !== null) result.push(op);
		}
		i++;
	}

	return result;
}