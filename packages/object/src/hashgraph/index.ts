import { doesNotMatch } from "node:assert";
import * as crypto from "node:crypto";
import { BitSet } from "./bitset.js";

type Hash = string;
export type Operation<T> = { type: string; value: T | null };

enum OperationType {
	NOP = "-1",
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
	dependencies: Hash[];
}

export class HashGraph<T> {
	nodeId: string;
	resolveConflicts: (vertices: Vertex<T>[]) => ActionType;

	vertices: Map<Hash, Vertex<T>> = new Map();
	frontier: Hash[] = [];
	forwardEdges: Map<Hash, Hash[]> = new Map();
	static readonly rootHash: Hash = computeHash(
		"",
		{ type: OperationType.NOP, value: null },
		[],
	);
	private arePredecessorsFresh = false;
	private reachablePredecessors: Map<Hash, BitSet> = new Map();
	private topoSortedIndex: Map<Hash, number> = new Map();
	// We start with a bitset of size 1, and double it every time we reach the limit
	private currentBitsetSize = 1;

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
		this.arePredecessorsFresh = false;
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
		this.arePredecessorsFresh = false;
		return hash;
	}

	// Time complexity: O(V + E), Space complexity: O(V)
	topologicalSort(): Hash[] {
		const result: Hash[] = [];
		const visited = new Set<Hash>();
		this.reachablePredecessors.clear();
		this.topoSortedIndex.clear();

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
		result.reverse();

		// Double the size until it's enough to hold all the vertices
		while (this.currentBitsetSize < result.length) this.currentBitsetSize *= 2;

		for (let i = 0; i < result.length; i++) {
			this.topoSortedIndex.set(result[i], i);
			this.reachablePredecessors.set(
				result[i],
				new BitSet(this.currentBitsetSize),
			);
			for (const dep of this.vertices.get(result[i])?.dependencies || []) {
				const depReachable = this.reachablePredecessors.get(dep);
				depReachable?.set(this.topoSortedIndex.get(dep) || 0, true);
				if (depReachable) {
					const reachable = this.reachablePredecessors.get(result[i]);
					this.reachablePredecessors.set(
						result[i],
						reachable?.or(depReachable) || depReachable,
					);
				}
			}
		}

		this.arePredecessorsFresh = true;
		return result;
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
				if (op && op.value !== null) result.push(op);
				i++;
			}
		}

		return result;
	}

	// Time complexity: O(V), Space complexity: O(V)
	areCausallyRelated(hash1: Hash, hash2: Hash): boolean {
		if (!this.arePredecessorsFresh) {
			this.topologicalSort();
		}

		const test1 =
			this.reachablePredecessors
				.get(hash1)
				?.get(this.topoSortedIndex.get(hash2) || 0) || false;
		const test2 =
			this.reachablePredecessors
				.get(hash2)
				?.get(this.topoSortedIndex.get(hash1) || 0) || false;
		return test1 || test2;
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
