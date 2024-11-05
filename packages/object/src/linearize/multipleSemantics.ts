import {
	ActionType,
	type Hash,
	type HashGraph,
	type Operation,
	type Vertex,
} from "../hashgraph/index.js";

export function linearizeMultiple(hashGraph: HashGraph): Operation[] {
	const reachableState = hashGraph.topologicalSort();
	const dropped = new Array(reachableState.getLength()).fill(false);
	const indices: Map<Hash, number> = new Map();
	const result: Operation[] = [];
	let i = 0;

	while (i < reachableState.getLength()) {
		if (dropped[i]) {
			i++;
			continue;
		}
		const anchor = reachableState.getHash(i);
		let j = i + 1;

		while (j < reachableState.getLength()) {
			if (dropped[i]) break;
			if (dropped[j]) {
				const nextIndex = reachableState.findNextCausallyUnrelated(anchor, j);
				if (nextIndex === undefined) break;
				j = nextIndex;
				continue;
			}
			const moving = reachableState.getHash(j);

			if (!reachableState.areCausallyRelatedUsingBitsets(anchor, moving)) {
				const concurrentOps: Hash[] = [];
				concurrentOps.push(anchor);
				indices.set(anchor, i);
				concurrentOps.push(moving);
				indices.set(moving, j);
				let k = j + 1;
				for (; k < reachableState.getLength(); k++) {
					let add = true;
					const hashK = reachableState.getHash(k);
					for (const hash of concurrentOps) {
						if (reachableState.areCausallyRelatedUsingBitsets(hash, hashK)) {
							add = false;
							break;
						}
					}
					if (add) {
						concurrentOps.push(hashK);
						indices.set(hashK, k);
					}
				}
				const resolved = hashGraph.resolveConflicts(
					concurrentOps.map((hash) => hashGraph.vertices.get(hash) as Vertex),
				);

				switch (resolved.action) {
					case ActionType.Drop: {
						for (const hash of resolved.vertices || []) {
							dropped[indices.get(hash) || -1] = true;
						}
						break;
					}
					case ActionType.Nop:
						j++;
						break;
				}
			}

			const nextIndex = reachableState.findNextCausallyUnrelated(anchor, j);
			if (nextIndex === undefined) break;
			j = nextIndex;
		}

		if (!dropped[i]) {
			const op = hashGraph.vertices.get(anchor)?.operation;
			if (op && op.value !== null) result.push(op);
			i++;
		}
	}

	return result;
}
