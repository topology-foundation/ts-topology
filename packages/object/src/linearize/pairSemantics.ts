import {
	ActionType,
	type HashGraph,
	type Operation,
	type Hash,
	type Vertex,
  } from "../hashgraph/index.js";
  
  export function linearizePair(hashGraph: HashGraph): Operation[] {
	const order = hashGraph.topologicalSort(true);
	const result: Operation[] = [];
	const vertexCache: Map<Hash, Vertex | undefined> = new Map();
  
	for (let i = 0; i < order.length; i++) {
	  const anchor = order[i];
	  const anchorVertex = getVertex(hashGraph, anchor, vertexCache);
  
	  if (!anchorVertex) continue;
  
	  let j = i + 1;
	  while (j < order.length) {
		const moving = order[j];
		if (!hashGraph.areCausallyRelatedUsingBitsets(anchor, moving)) {
		  const movingVertex = getVertex(hashGraph, moving, vertexCache);
		  if (!movingVertex) {
			j++;
			continue;
		  }
  
		  const action = hashGraph.resolveConflicts([anchorVertex, movingVertex]).action;
  
		  switch (action) {
			case ActionType.DropLeft:
			  order.splice(i, 1);
			  i--;
			  j = order.length;
			  break;
			case ActionType.DropRight:
			  order.splice(j, 1);
			  continue;
			case ActionType.Swap:
			  [order[i], order[j]] = [order[j], order[i]];
			  j = order.length;
			  break;
			case ActionType.Nop:
			  j++;
			  break;
		  }
		} else {
		  j++;
		}
	  }
  
	  const op = anchorVertex.operation;
	  if (op && op.value !== null) result.push(op);
	}
  
	return result;
  }
  
  function getVertex(hashGraph: HashGraph, hash: Hash, cache: Map<Hash, Vertex | undefined>): Vertex | undefined {
	if (!cache.has(hash)) {
	  cache.set(hash, hashGraph.vertices.get(hash));
	}
	return cache.get(hash);
  }