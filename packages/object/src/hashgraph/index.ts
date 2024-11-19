import * as crypto from "node:crypto";
import { Logger } from "@topology-foundation/logger";
import { linearizeMultiple } from "../linearize/multipleSemantics.js";
import { linearizePair } from "../linearize/pairSemantics.js";
import {
	Vertex_Operation as Operation,
	Vertex,
} from "../proto/topology/object/object_pb.js";
import { BitSet } from "./bitset.js";

const log: Logger = new Logger("hashgraph");

// Reexporting the Vertex and Operation types from the protobuf file
export { Vertex, Operation };

export type Hash = string;

export enum DepthFirstSearchState {
	UNVISITED = 0,
	VISITING = 1,
	VISITED = 2,
}

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
		"02465e287e3d086f12c6edd856953ca5ad0f01d6707bf8e410b4a601314c1ca5";
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

	/* Add a vertex to the hashgraph with the given operation and dependencies.
	 * If the vertex already exists, return the hash of the existing vertex.
	 * Throws an error if any of the dependencies are not present in the hashgraph.
	 */
	addVertex(operation: Operation, deps: Hash[], nodeId: string): Hash {
		const hash = computeHash(nodeId, operation, deps);
		if (this.vertices.has(hash)) {
			return hash; // Vertex already exists
		}

		if (
			!deps.every((dep) => this.forwardEdges.has(dep) || this.vertices.has(dep))
		) {
			throw new Error("Invalid dependency detected.");
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

	depthFirstSearch(visited: Map<Hash, number> = new Map()): Hash[] {
		const result: Hash[] = [];
		for (const vertex of this.getAllVertices()) {
			visited.set(vertex.hash, DepthFirstSearchState.UNVISITED);
		}
		const visit = (hash: Hash) => {
			visited.set(hash, DepthFirstSearchState.VISITING);

			const children = this.forwardEdges.get(hash) || [];
			for (const child of children) {
				if (visited.get(child) === DepthFirstSearchState.VISITING) {
					log.error("::hashgraph::DFS: Cycle detected");
					return;
				}
				if (visited.get(child) === undefined) {
					log.error("::hashgraph::DFS: Undefined child");
					return;
				}
				if (visited.get(child) === DepthFirstSearchState.UNVISITED) {
					visit(child);
				}
			}

			result.push(hash);
			visited.set(hash, DepthFirstSearchState.VISITED);
		};

		visit(HashGraph.rootHash);

		return result;
	}

	topologicalSort(updateBitsets = false): Hash[] {
		const result = this.depthFirstSearch();
		result.reverse();
		if (!updateBitsets) return result;

		this.reachablePredecessors.clear();
		this.topoSortedIndex.clear();

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

	private _areCausallyRelatedUsingBFS(start: Hash, target: Hash): boolean {
		const visited = new Set<Hash>();
		const queue: Hash[] = [];
		let head = 0;

		queue.push(start);

		while (head < queue.length) {
			const current = queue[head];
			head++;

			if (current === target) return true;
			if (current === undefined) continue;

			visited.add(current);
			const vertex = this.vertices.get(current);
			if (!vertex) continue;

			for (const dep of vertex.dependencies) {
				if (!visited.has(dep)) {
					queue.push(dep);
				}
			}

			if (head > queue.length / 2) {
				queue.splice(0, head);
				head = 0;
			}
		}
		return false;
	}

	selfCheckConstraints(): boolean {
		const degree = new Map<Hash, number>();
		for (const vertex of this.getAllVertices()) {
			const hash = vertex.hash;
			degree.set(hash, 0);
		}
		for (const [_, children] of this.forwardEdges) {
			for (const child of children) {
				degree.set(child, (degree.get(child) || 0) + 1);
			}
		}
		for (const vertex of this.getAllVertices()) {
			const hash = vertex.hash;
			if (degree.get(hash) !== vertex.dependencies.length) {
				return false;
			}
			if (vertex.dependencies.length === 0) {
				if (hash !== HashGraph.rootHash) {
					return false;
				}
			}
		}

		const visited = new Map<Hash, number>();
		this.depthFirstSearch(visited);
		for (const vertex of this.getAllVertices()) {
			if (!visited.has(vertex.hash)) {
				return false;
			}
		}

		return true;
	}

	findNextUnusuallyRelated(hash: Hash, start: number): number | undefined {
		if (!this.arePredecessorsFresh) {
			this.topologicalSort(true);
		}
		const currentIndex = this.topoSortedIndex.get(hash);
		if (currentIndex === undefined) return undefined;

		const nextIndex = this.reachablePredecessors.get(hash)?.findNext(start, 0);
		if (nextIndex === undefined) return undefined;

		return nextIndex;
	}

	areCausallyRelatedUsingBFS(hash1: Hash, hash2: Hash): boolean {
		return (
			this._areCausallyRelatedUsingBFS(hash1, hash2) ||
			this._areCausallyRelatedUsingBFS(hash2, hash1)
		);
	}

	getFrontier(): Hash[] {
		return Array.from(this.frontier);
	}

	getDependencies(vertexHash: Hash): Hash[] {
		return Array.from(this.vertices.get(vertexHash)?.dependencies || []);
	}

	getVertex(hash: Hash): Vertex | undefined {
		return this.vertices.get(hash);
	}

	getAllVertices(): Vertex[] {
		return Array.from(this.vertices.values());
	}
}

function computeHash<T>(
	nodeId: string,
	operation: Operation,
	deps: Hash[],
): Hash {
	const serialized = JSON.stringify({ operation, deps, nodeId });
	const hash = crypto.createHash("sha256").update(serialized).digest("hex");
	return hash;
}
