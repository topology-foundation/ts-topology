import {
	type Hash,
	type Operation,
	HashGraph,
} from "@topology-foundation/object";

type ReductionType<T> = { hash: Hash; op: Operation<T>; index: number };
type ResolvedConflict = { action: ActionType; indeces: number[] };

enum ActionType {
	Reduce = 0,
	Nop = 1,
}

/// Example implementation of the Reduce action type
/// An arbitrary number of concurrent operations can be reduced to a single operation
export class ReduceActionType<T> {
	hashGraph: HashGraph<T>;

	constructor(nodeId: string) {
		this.hashGraph = new HashGraph<T>(nodeId);
	}

	// TODO
	resolveConflicts(ops: ReductionType<T>[]): ResolvedConflict {
		if (op1.type !== op2.type && op1.value === op2.value) {
			return op1.type === OperationType.Add
				? ActionType.DropRight
				: ActionType.DropLeft;
		}
		return ActionType.Nop;
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
					const resolved = this.resolveConflicts(concurrentOps);

					switch (resolved.action) {
						case ActionType.Reduce:
							for (const idx of resolved.indeces) {
								if (idx === i) shouldIncrementI = false;
								order.splice(idx, 1);
							}
							j = order.length; // Break out of inner loop
							shouldIncrementI = false;
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
