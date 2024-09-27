import { HashGraph, Operation, Vertex } from "../hashgraph/index.js";

export function linearizeMultiple(hashGraph: HashGraph): Operation[] {
	const sortedVertices = hashGraph.topologicalSort();
	const result: Operation[] = [];
	const addedValues = new Set<any>();
	const concurrentOps: Map<string, Vertex[]> = new Map();

	for (const hash of sortedVertices) {
		const vertex = hashGraph.getVertex(hash);
		if (vertex && vertex.operation) {
			const key = `${vertex.operation.type}-${vertex.operation.value}`;
			if (!concurrentOps.has(key)) {
				concurrentOps.set(key, []);
			}
			concurrentOps.get(key)!.push(vertex);
		}
	}

	for (const [_, vertices] of concurrentOps) {
		if (vertices.length > 1) {
			const { action, vertices: droppedVertices } = hashGraph.resolveConflicts(vertices);
			if (droppedVertices) {
				const keptVertex = vertices.find(v => !droppedVertices.includes(v.hash));
				if (keptVertex && keptVertex.operation) {
					result.push(keptVertex.operation);
					if (keptVertex.operation.type === 'add') {
						addedValues.add(keptVertex.operation.value);
					} else if (keptVertex.operation.type === 'remove') {
						addedValues.delete(keptVertex.operation.value);
					}
				}
			}
		} else if (vertices.length === 1) {
			const vertex = vertices[0];
			if (vertex.operation) {
				if (vertex.operation.type === 'add') {
					result.push(vertex.operation);
					addedValues.add(vertex.operation.value);
				} else if (vertex.operation.type === 'remove' && addedValues.has(vertex.operation.value)) {
					result.push(vertex.operation);
					addedValues.delete(vertex.operation.value);
				}
			}
		}
	}

	return result;
}