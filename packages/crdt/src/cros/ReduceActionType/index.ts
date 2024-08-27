import { Smush32 } from "@thi.ng/random";
import {
	HashGraph,
	type Hash,
	type Operation,
} from "@topology-foundation/object";

type ReductionType<T> = { hash: Hash; op: Operation<T>; index: number };
type ResolvedConflict = { action: ActionType; indices: number[] };

export enum ActionType {
	Reduce = 0,
	Nop = 1,
}

const MOD = 1e9 + 9;

function compute_hash(s: string): number {
	let hash = 0;
	for (let i = 0; i < s.length; i++) {
		// Same as hash = hash * 31 + s.charCodeAt(i);
		hash = (hash << 5) - hash + s.charCodeAt(i);
		hash %= MOD;
	}
	return hash;
}

/// Example implementation of the Reduce action type
/// An arbitrary number of concurrent operations can be reduced to a single operation
export class ReduceActionType<T> {
	hashGraph: HashGraph<T>;

	constructor(nodeId: string) {
		this.hashGraph = new HashGraph<T>(nodeId);
	}

	resolveConflicts(ops: ReductionType<T>[]): ResolvedConflict {
		ops.sort((a, b) => (a.hash < b.hash ? -1 : 1));
		const seed: string = ops.map((op) => op.hash).join("");
		console.log("Hashing...", seed, compute_hash(seed));
		const rnd = new Smush32(compute_hash(seed));
		const chosen = rnd.int() % ops.length;
		const indices = ops.map((op) => op.index);
		indices.splice(chosen, 1);
		return { action: ActionType.Reduce, indices: indices };
	}

	linearizeOps(): Operation<T>[] {
		const order = this.hashGraph.topologicalSort();
		const result: Operation<T>[] = [];
		let i = 0;

		while (i < order.length) {
			const anchor = order[i];
			let j = i + 1;
			let shouldIncrementI = true;

			while (j < order.length) {
				const moving = order[j];

				if (!this.hashGraph.areCausallyRelated(anchor, moving)) {
					console.log("Start the magic", i, j);
					const concurrentOps: ReductionType<T>[] = [];
					concurrentOps.push({
						hash: anchor,
						op: this.hashGraph.vertices.get(anchor)?.operation as Operation<T>,
						index: i,
					});
					concurrentOps.push({
						hash: moving,
						op: this.hashGraph.vertices.get(moving)?.operation as Operation<T>,
						index: j,
					});
					let k = j + 1;
					for (; k < order.length; k++) {
						let add = true;
						for (const op of concurrentOps) {
							if (this.hashGraph.areCausallyRelated(op.hash, order[k])) {
								add = false;
								break;
							}
						}
						if (add) {
							concurrentOps.push({
								hash: order[k],
								op: this.hashGraph.vertices.get(order[k])
									?.operation as Operation<T>,
								index: k,
							});
						}
					}
					console.log("Concurrent ops: ", concurrentOps);
					const resolved = this.resolveConflicts(concurrentOps);
					console.log("Resolved: ", resolved);

					switch (resolved.action) {
						case ActionType.Reduce:
							// Sort the indices in descending order, so that splice does not mess up the order
							resolved.indices.sort((a, b) => (a < b ? 1 : -1));
							for (const idx of resolved.indices) {
								if (idx === i) shouldIncrementI = false;
								order.splice(idx, 1);
								console.log("Spliced at", idx);
								console.log("After splicing: ", order);
							}
							if (!shouldIncrementI) j = order.length; // Break out of inner loop
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
				result.push(
					this.hashGraph.vertices.get(order[i])?.operation as Operation<T>,
				);
				i++;
			}
		}

		return result;
	}
}
