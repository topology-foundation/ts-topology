import * as crypto from "node:crypto";

type Hash = string;
export type Operation<T> = { type: number; value: T | null };

enum OperationType {
	NOP = -1,
}

export enum ActionType {
	DropLeft = 0,
	DropRight = 1,
	Nop = 2,
	Swap = 3,
}

export interface Vertex<T> {
	hash: Hash;
	nodeId: string;
	// internal Operation type enum converted to number
	// -1 for NOP
	operation: Operation<T>;
	dependencies: Set<Hash>;
}

export class HashGraph<T> {
	nodeId: string;
	resolveConflicts: (vertices: Vertex<T>[]) => ActionType;

	vertices: Map<Hash, Vertex<T>> = new Map();
	frontier: Set<Hash> = new Set();
	forwardEdges: Map<Hash, Set<Hash>> = new Map();
	static readonly rootHash: Hash = computeHash(
		{ type: OperationType.NOP, value: null },
		[],
		"",
	);

	constructor(
		nodeId: string,
		resolveConflicts: (vertices: Vertex<T>[]) => ActionType,
	) {
		this.nodeId = nodeId;
		this.resolveConflicts = resolveConflicts;

		// Create and add the NOP root vertex
		const rootVertex: Vertex<T> = {
			hash: HashGraph.rootHash,
			nodeId: "",
			operation: {
				type: OperationType.NOP,
				value: null,
			},
			dependencies: new Set(),
		};
		this.vertices.set(HashGraph.rootHash, rootVertex);
		this.frontier.add(HashGraph.rootHash);
		this.forwardEdges.set(HashGraph.rootHash, new Set());
	}

	addToFrontier(operation: Operation<T>): Hash {
		const deps = this.getFrontier();
		const hash = computeHash(operation, deps, this.nodeId);
		const vertex: Vertex<T> = {
			hash,
			nodeId: this.nodeId,
			operation,
			dependencies: new Set(deps),
		};

		this.vertices.set(hash, vertex);
		this.frontier.add(hash);

		// Update forward edges
		for (const dep of deps) {
			if (!this.forwardEdges.has(dep)) {
				this.forwardEdges.set(dep, new Set());
			}
			this.forwardEdges.get(dep)?.add(hash);
			this.frontier.delete(dep);
		}
		return hash;
	}

	// Time complexity: O(d), where d is the number of dependencies
	// Space complexity: O(d)
	addVertex(operation: Operation<T>, deps: Hash[], nodeId: string): Hash {
		// Temporary fix: don't add the vertex if the dependencies are not present in the local HG.
		if (
			!deps.every((dep) => this.forwardEdges.has(dep) || this.vertices.has(dep))
		) {
			console.error("Invalid dependency detected.");
			return "";
		}

		const hash = computeHash(operation, deps, nodeId);
		if (this.vertices.has(hash)) {
			return hash; // Vertex already exists
		}

		const vertex: Vertex<T> = {
			hash,
			nodeId,
			operation,
			dependencies: new Set(deps),
		};
		this.vertices.set(hash, vertex);
		this.frontier.add(hash);

		// Update forward edges
		for (const dep of deps) {
			if (!this.forwardEdges.has(dep)) {
				this.forwardEdges.set(dep, new Set());
			}
			this.forwardEdges.get(dep)?.add(hash);
			this.frontier.delete(dep);
		}

		return hash;
	}

	// Time complexity: O(V + E), Space complexity: O(V)
	topologicalSort(): Hash[] {
		const result: Hash[] = [];
		const visited = new Set<Hash>();

		const visit = (hash: Hash) => {
			if (visited.has(hash)) return;

			visited.add(hash);

			const children = this.forwardEdges.get(hash) || new Set();
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
		const order = this.topologicalSort();
		const result: Operation<T>[] = [];
		let i = 0;

		while (i < order.length) {
			const anchor = order[i];
			let j = i + 1;
			let shouldIncrementI = true;

			while (j < order.length) {
				const moving = order[j];

				if (!this.areCausallyRelated(anchor, moving)) {
					const v1 = this.vertices.get(anchor);
					const v2 = this.vertices.get(moving);
					let action: ActionType;
					if (!v1 || !v2) {
						action = ActionType.Nop;
					} else {
						action = this.resolveConflicts([v1, v2]);
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
				const op = this.vertices.get(order[i])?.operation;
				if (op) result.push();
				i++;
			}
		}

		return result;
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
	operation: Operation<T>,
	deps: Hash[],
	nodeId: string,
): Hash {
	const serialized = JSON.stringify({ operation, deps, nodeId });
	const hash = crypto.createHash("sha256").update(serialized).digest("hex");

	return hash;
}
