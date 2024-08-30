import * as crypto from "node:crypto";
import { linearizePairWise } from "./linearize/pair-wiseSemantics.js";
import { linearizeMultiVertex } from "./linearize/multi-vertexSemantics.js";

export type Hash = string;
export type Operation<T> = { type: string; value: T | null };

enum OperationType {
	NOP = "-1",
}

export enum ActionType {
	DropLeft = 0,
	DropRight = 1,
	Nop = 2,
	Swap = 3,
	Reduce = 4,
}

export enum SemanticsType {
	pairWise = 0,
	multiVertex = 1,
}

// In the case of multi-vertex semantics, we are returning an array of vertices (their hashes) to be reduced.
export type ResolveConflictsType = {
	action: ActionType;
	vertices?: Hash[];
};

export interface Vertex<T> {
	hash: Hash;
	nodeId: string;
	// internal Operation type enum converted to number
	// -1 for NOP
	operation: Operation<T>;
	dependencies: Hash[];
}

export class HashGraph<T> {
	nodeId: string;
	resolveConflicts: (vertices: Vertex<T>[]) => ResolveConflictsType;
	semanticsType: SemanticsType;

	vertices: Map<Hash, Vertex<T>> = new Map();
	frontier: Hash[] = [];
	forwardEdges: Map<Hash, Hash[]> = new Map();
	static readonly rootHash: Hash = computeHash(
		"",
		{ type: OperationType.NOP, value: null },
		[],
	);

	constructor(
		nodeId: string,
		resolveConflicts: (vertices: Vertex<T>[]) => ResolveConflictsType,
		semanticsType: SemanticsType,
	) {
		this.nodeId = nodeId;
		this.resolveConflicts = resolveConflicts;
		this.semanticsType = semanticsType;

		// Create and add the NOP root vertex
		const rootVertex: Vertex<T> = {
			hash: HashGraph.rootHash,
			nodeId: "",
			operation: {
				type: OperationType.NOP,
				value: null,
			},
			dependencies: [],
		};
		this.vertices.set(HashGraph.rootHash, rootVertex);
		this.frontier.push(HashGraph.rootHash);
		this.forwardEdges.set(HashGraph.rootHash, []);
	}

	addToFrontier(operation: Operation<T>): Hash {
		const deps = this.getFrontier();
		const hash = computeHash(this.nodeId, operation, deps);
		const vertex: Vertex<T> = {
			hash,
			nodeId: this.nodeId,
			operation,
			dependencies: deps,
		};

		this.vertices.set(hash, vertex);
		this.frontier.push(hash);

		// Update forward edges
		for (const dep of deps) {
			if (!this.forwardEdges.has(dep)) {
				this.forwardEdges.set(dep, []);
			}
			this.forwardEdges.get(dep)?.push(hash);
		}

		const depsSet = new Set(deps);
		this.frontier = this.frontier.filter((hash) => !depsSet.has(hash));
		return hash;
	}

	// Time complexity: O(d), where d is the number of dependencies
	// Space complexity: O(d)
	addVertex(operation: Operation<T>, deps: Hash[], nodeId: string): Hash {
		const hash = computeHash(nodeId, operation, deps);
		if (this.vertices.has(hash)) {
			return hash; // Vertex already exists
		}

		// Temporary fix: don't add the vertex if the dependencies are not present in the local HG.
		if (
			!deps.every((dep) => this.forwardEdges.has(dep) || this.vertices.has(dep))
		) {
			console.error("Invalid dependency detected.");
			return "";
		}

		const vertex: Vertex<T> = {
			hash,
			nodeId,
			operation,
			dependencies: deps,
		};
		this.vertices.set(hash, vertex);
		this.frontier.push(hash);

		// Update forward edges
		for (const dep of deps) {
			if (!this.forwardEdges.has(dep)) {
				this.forwardEdges.set(dep, []);
			}
			this.forwardEdges.get(dep)?.push(hash);
		}

		const depsSet = new Set(deps);
		this.frontier = this.frontier.filter((hash) => !depsSet.has(hash));

		return hash;
	}

	// Time complexity: O(V + E), Space complexity: O(V)
	topologicalSort(): Hash[] {
		const result: Hash[] = [];
		const visited = new Set<Hash>();

		const visit = (hash: Hash) => {
			if (visited.has(hash)) return;

			visited.add(hash);

			const children = this.forwardEdges.get(hash) || [];
			for (const child of children) {
				visit(child);
			}
			result.push(hash);
		};
		// Start with the root vertex
		visit(HashGraph.rootHash);

		return result.reverse();
	}

	linearizeOperations(): Operation<T>[] {
		switch (this.semanticsType) {
			case SemanticsType.pairWise:
				return linearizePairWise(this);
			case SemanticsType.multiVertex:
				return linearizeMultiVertex(this);
			default:
				return [];
		}
	}

	// Time complexity: O(V), Space complexity: O(V)
	areCausallyRelated(hash1: Hash, hash2: Hash): boolean {
		const visited = new Set<Hash>();
		const stack = [hash1];

		while (stack.length > 0) {
			const current = stack.pop();
			if (current === hash2) return true;
			if (current === undefined) continue;
			visited.add(current);

			const vertex = this.vertices.get(current);
			if (!vertex) continue;
			for (const dep of vertex.dependencies) {
				if (!visited.has(dep)) {
					stack.push(dep);
				}
			}
		}

		visited.clear();
		stack.push(hash2);

		while (stack.length > 0) {
			const current = stack.pop();
			if (current === hash1) return true;
			if (current === undefined) continue;
			visited.add(current);

			const vertex = this.vertices.get(current);
			if (!vertex) continue;
			for (const dep of vertex.dependencies) {
				if (!visited.has(dep)) {
					stack.push(dep);
				}
			}
		}

		return false;
	}

	// Time complexity: O(1), Space complexity: O(1)
	getFrontier(): Hash[] {
		return Array.from(this.frontier);
	}

	// Time complexity: O(1), Space complexity: O(1)
	getDependencies(vertexHash: Hash): Hash[] {
		return Array.from(this.vertices.get(vertexHash)?.dependencies || []);
	}

	// Time complexity: O(1), Space complexity: O(1)
	getVertex(hash: Hash): Vertex<T> | undefined {
		return this.vertices.get(hash);
	}

	// Time complexity: O(V), Space complexity: O(V)
	getAllVertices(): Vertex<T>[] {
		return Array.from(this.vertices.values());
	}
}

// Time complexity: O(1), Space complexity: O(1)
function computeHash<T>(
	nodeId: string,
	operation: Operation<T>,
	deps: Hash[],
): Hash {
	const serialized = JSON.stringify({ operation, deps, nodeId });
	const hash = crypto.createHash("sha256").update(serialized).digest("hex");
	return hash;
}
