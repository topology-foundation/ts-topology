import * as crypto from "node:crypto";

export type Hash = string;

export class Vertex<T> {
	constructor(
		readonly hash: Hash,
		readonly operation: Operation<T>,
		readonly dependencies: Set<Hash>,
	) {}
}

export enum ActionType {
	DropLeft = 0,
	DropRight = 1,
	Nop = 2,
	Swap = 3,
}

export enum OperationType {
	Add = 0,
	Remove = 1,
	Nop = 2,
}

export class Operation<T> {
	constructor(
		readonly type: OperationType,
		readonly value: T,
	) {}
}

export interface IHashGraph<T> {
	addVertex(op: T, deps: Hash[], nodeId: string): Hash;
	addToFrontier(op: T): Hash;
	topologicalSort(): Hash[];
	areCausallyRelated(vertexHash1: Hash, vertexHash2: Hash): boolean;
	getFrontier(): Hash[];
	getDependencies(vertexHash: Hash): Hash[] | undefined;
	getVertex(vertexHash: Hash): Vertex<T> | undefined;
	getAllVertices(): Vertex<T>[];
}

export class HashGraph<T> {
	vertices: Map<Hash, Vertex<T>> = new Map();
	private frontier: Set<Hash> = new Set();
	private forwardEdges: Map<Hash, Set<Hash>> = new Map();
	rootHash: Hash = "";

	constructor(private nodeId: string) {
		// Create and add the NOP root vertex
		const nopOperation = new Operation(OperationType.Nop, 0 as T);
		this.rootHash = this.computeHash(nopOperation, [], "");
		const rootVertex = new Vertex(this.rootHash, nopOperation, new Set());
		this.vertices.set(this.rootHash, rootVertex);
		this.frontier.add(this.rootHash);
		this.forwardEdges.set(this.rootHash, new Set());
	}

	// Time complexity: O(1), Space complexity: O(1)
	private computeHash(op: Operation<T>, deps: Hash[], nodeId: string): Hash {
		const serialized = JSON.stringify({ op, deps, nodeId });
		const hash = crypto.createHash("sha256").update(serialized).digest("hex");

		return hash;
	}

	addToFrontier(operation: Operation<T>): Hash {
		const deps = this.getFrontier();
		const hash = this.computeHash(operation, deps, this.nodeId);
		const vertex = new Vertex(hash, operation, new Set(deps));

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
	addVertex(op: Operation<T>, deps: Hash[], nodeId: string): Hash {
		// Temporary fix: don't add the vertex if the dependencies are not present in the local HG.
		if (
			!deps.every((dep) => this.forwardEdges.has(dep) || this.vertices.has(dep))
		) {
			console.log("Invalid dependency detected.");
			return "";
		}

		const hash = this.computeHash(op, deps, nodeId);
		if (this.vertices.has(hash)) {
			return hash; // Vertex already exists
		}

		const vertex = new Vertex(hash, op, new Set(deps));
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
		visit(this.rootHash);

		result.reverse().splice(0, 1); // Remove the Nop
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
	getRoot(): Hash {
		return this.rootHash;
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
