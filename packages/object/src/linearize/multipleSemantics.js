import { ActionType, } from "../hashgraph/index.js";
export function linearizeMultiple(hashGraph) {
    let order = hashGraph.topologicalSort(true);
    const indices = new Map();
    const result = [];
    let i = 0;
    while (i < order.length) {
        const anchor = order[i];
        let j = i + 1;
        let shouldIncrementI = true;
        while (j < order.length) {
            const moving = order[j];
            if (!hashGraph.areCausallyRelatedUsingBitsets(anchor, moving)) {
                const concurrentOps = [];
                concurrentOps.push(anchor);
                indices.set(anchor, i);
                concurrentOps.push(moving);
                indices.set(moving, j);
                let k = j + 1;
                for (; k < order.length; k++) {
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
                    }
                }
                const resolved = hashGraph.resolveConflicts(concurrentOps.map((hash) => hashGraph.vertices.get(hash)));
                switch (resolved.action) {
                    case ActionType.Drop: {
                        const newOrder = [];
                        for (const hash of resolved.vertices || []) {
                            if (indices.get(hash) === i)
                                shouldIncrementI = false;
                            order[indices.get(hash) || -1] = "";
                        }
                        for (const val of order) {
                            if (val !== "")
                                newOrder.push(val);
                        }
                        order = newOrder;
                        if (!shouldIncrementI)
                            j = order.length; // Break out of inner loop
                        break;
                    }
                    case ActionType.Nop:
                        j++;
                        break;
                }
            }
            else {
                j++;
            }
        }
        if (shouldIncrementI) {
            const op = hashGraph.vertices.get(order[i])?.operation;
            if (op && op.value !== null)
                result.push(op);
            i++;
        }
    }
    return result;
}
