import * as crypto from "crypto";

type Hash = string;

class Vertex<T> {
  constructor(
    readonly hash: Hash,
    readonly operation: T,
    readonly dependencies: Set<Hash>
  ) { }
}

export enum ActionType {
  DropLeft,
  DropRight,
  Nop,
  Swap
}
export class HashGraph<T> {
  private vertices: Map<Hash, Vertex<T>> = new Map();
  private frontier: Set<Hash> = new Set();
  private forwardEdges: Map<Hash, Set<Hash>> = new Map();
  private root: Hash = "";

  constructor(private resolveConflicts: (op1: T, op2: T) => ActionType, private nodeId: string) { }

  // Time complexity: O(1), Space complexity: O(1)
  computeHash(op: T, deps: Hash[], peerId: String): Hash {
    const serialized = JSON.stringify({ op, deps, peerId });
    const hash = crypto
      .createHash("sha256")
      .update(serialized)
      .digest("hex");

    return hash;
  }

  addToFrontier(operation: T): Hash {
    const deps = this.getFrontier();
    const hash = this.computeHash(operation, deps, this.nodeId)
    const vertex = new Vertex(hash, operation, new Set(deps));

    this.vertices.set(hash, vertex);
    this.frontier.add(hash);

    // update root
    if (deps.length === 0) {
      this.root = hash;
    }
    // Update forward edges
    for (const dep of deps) {
      if (!this.forwardEdges.has(dep)) {
        this.forwardEdges.set(dep, new Set());
      }
      this.forwardEdges.get(dep)!.add(hash);
      this.frontier.delete(dep);
    }
    return hash;
  }
  // Time complexity: O(d), where d is the number of dependencies
  // Space complexity: O(d)
  addVertex(op: T, deps: Hash[], peerId: string): Hash {

    // Temporary fix: don't add the vertex if the dependencies are not present in the local HG.
    if (!deps.every(dep => this.forwardEdges.has(dep) || this.vertices.has(dep))) {
      console.log("Invalid dependency detected.");
      return ""
    }

    const hash = this.computeHash(op, deps, peerId);
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
      this.forwardEdges.get(dep)!.add(hash);
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

      const vertex = this.vertices.get(hash)!;
      visited.add(hash);
      result.push(hash);

      // Check if all dependencies are visited
      if (Array.from(vertex.dependencies).every(dep => visited.has(dep))) {
        const children = this.forwardEdges.get(hash) || new Set();
        for (const child of children) {
          visit(child);
        }
      }
    };
    // Start with the root vertex
    visit(this.root);

    return result;
  }

  linearizeOps(): T[] {
    const order = this.topologicalSort();
    const result: T[] = [];
    let i = 0;

    while (i < order.length) {
      const anchor = order[i];
      let j = i + 1;
      let shouldIncrementI = true;

      while (j < order.length) {
        const moving = order[j];

        if (!this.areCausallyRelated(anchor, moving)) {
          const op1 = this.vertices.get(anchor)!.operation;
          const op2 = this.vertices.get(moving)!.operation;
          const action = this.resolveConflicts(op1, op2);

          switch (action) {
            case ActionType.DropLeft:
              order.splice(i, 1);
              j = order.length;  // Break out of inner loop
              shouldIncrementI = false;
              continue;  // Continue outer loop without incrementing i
            case ActionType.DropRight:
              order.splice(j, 1);
              continue;  // Continue with the same j
            case ActionType.Swap:
              [order[i], order[j]] = [order[j], order[i]];
              j = order.length;  // Break out of inner loop
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
        result.push(this.vertices.get(order[i])!.operation);
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
      const current = stack.pop()!;
      if (current === hash2) return true;
      visited.add(current);

      const vertex = this.vertices.get(current)!;
      for (const dep of vertex.dependencies) {
        if (!visited.has(dep)) {
          stack.push(dep);
        }
      }
    }

    visited.clear();
    stack.push(hash2);

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === hash1) return true;
      visited.add(current);

      const vertex = this.vertices.get(current)!;
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
    return this.root;
  }

  // Time complexity: O(1), Space complexity: O(1)
  getDependencies(hash: Hash): Hash[] {
    return Array.from(this.vertices.get(hash)?.dependencies || []);
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