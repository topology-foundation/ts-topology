import * as crypto from "node:crypto";
import { linearizeMultiple } from "../linearize/multipleSemantics.js";
import { linearizePair } from "../linearize/pairSemantics.js";
import {
	Vertex_Operation as Operation,
	Vertex,
} from "../proto/topology/object/object_pb.js";
import { BitSet } from "./bitset.js";

// Reexporting the Vertex and Operation types from the protobuf file
export { Vertex, Operation };

export type Hash = string;

export enum OperationType {
	NOP = "-1",
}

export enum ActionType {
	DropLeft = 0,
	DropRight = 1,
	Nop = 2,
	Swap = 3,
	Drop = 4,
}

export enum SemanticsType {
	pair = 0,
	multiple = 1,
}

// In the case of multi-vertex semantics, we are returning an array of vertices (their hashes) to be reduced.
export type ResolveConflictsType = {
	action: ActionType;
	vertices?: Hash[];
};

export class HashGraph {
	nodeId: string;
	resolveConflicts: (vertices: Vertex[]) => ResolveConflictsType;
	semanticsType: SemanticsType;

	vertices: Map<Hash, Vertex> = new Map();
	frontier: Hash[] = [];
	forwardEdges: Map<Hash, Hash[]> = new Map();
	/*
	computeHash(
		"",
		{ type: OperationType.NOP },
		[],
	)
	*/
	static readonly rootHash: Hash =
		"ee075937c2a6c8ccf8d94fb2a130c596d3dbcc32910b6e744ad55c3e41b41ad6";
	private arePredecessorsFresh = false;
	private reachablePredecessors: Map<Hash, BitSet> = new Map();
	private topoSortedIndex: Map<Hash, number> = new Map();
	// We start with a bitset of size 1, and double it every time we reach the limit
	private currentBitsetSize = 1;

	constructor(
		nodeId: string,
		resolveConflicts: (vertices: Vertex[]) => ResolveConflictsType,
		semanticsType: SemanticsType,
	) {
		this.nodeId = nodeId;
		this.resolveConflicts = resolveConflicts;
		this.semanticsType = semanticsType;

		// Create and add the NOP root vertex
		const rootVertex: Vertex = {
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

	addToFrontier(operation: Operation): Vertex {
		const deps = this.getFrontier();
		const hash = computeHash(this.nodeId, operation, deps);

		const vertex: Vertex = {
			hash,
			nodeId: this.nodeId,
			operation: operation ?? { type: OperationType.NOP },
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
		return vertex;
	}

	// Time complexity: O(d), where d is the number of dependencies
	// Space complexity: O(d)
	addVertex(operation: Operation, deps: Hash[], nodeId: string): Hash {
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

		const vertex: Vertex = {
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
	topologicalSort(updateBitsets = false): Hash[] {
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

		if (!updateBitsets) return result;

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

	linearizeOperations(): Operation[] {
		switch (this.semanticsType) {
			case SemanticsType.pair:
				return linearizePair(this);
			case SemanticsType.multiple:
				return linearizeMultiple(this);
			default:
				return [];
		}
	}

	// Amortised time complexity: O(1), Amortised space complexity: O(1)
	areCausallyRelatedUsingBitsets(hash1: Hash, hash2: Hash): boolean {
		if (!this.arePredecessorsFresh) {
			this.topologicalSort(true);
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

	// Time complexity: O(V), Space complexity: O(V)
	areCausallyRelatedUsingBFS(hash1: Hash, hash2: Hash): boolean {
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
	getVertex(hash: Hash): Vertex | undefined {
		return this.vertices.get(hash);
	}

	// Time complexity: O(V), Space complexity: O(V)
	getAllVertices(): Vertex[] {
		return Array.from(this.vertices.values());
	}
}

// Time complexity: O(1), Space complexity: O(1)
function computeHash<T>(
	nodeId: string,
	operation: Operation,
	deps: Hash[],
): Hash {
	const serialized = JSON.stringify({ operation, deps, nodeId });
	const hash = crypto.createHash("sha256").update(serialized).digest("hex");
	return hash;
}
