import { sha256 } from "js-sha256";

type Hash = string;

interface Operation {
    type: string;
    value: any;
}

class Vertex<T extends Operation> {
    constructor(
        public readonly hash: Hash,
        public readonly operation: T,
        public readonly dependencies: Set<Hash>
    ) {}
}

export enum ActionType {
    DropLeft,
    DropRight,
    Nop,
    Swap
}

interface VertexInfo {
    parent: Hash;
    depth: number;
    ancestors: Hash[];
}

export class HashGraph<T extends Operation> {
    private vertices: Map<Hash, Vertex<T>> = new Map();
    private vertexInfo: Map<Hash, VertexInfo> = new Map();
    private frontier: Set<Hash> = new Set();
    private root: Hash = "";
    private maxLog: number = 0;

    constructor(private resolveConflicts: (op1: T, op2: T) => ActionType) {}

    // Time complexity: O(1), Space complexity: O(1)
    computeHash(op: T, dependencies: Hash[]): Hash {
        const serialized = JSON.stringify({ op, dependencies });
        return sha256(serialized);
    }

    // Time complexity: O(log n), Space complexity: O(log n)
    addVertex(operation: T, dependencies: Hash[] = []): Hash {
        const hash = this.computeHash(operation, dependencies);
        if (this.vertices.has(hash)) {
            return hash; // Vertex already exists
        }

        const vertex = new Vertex(hash, operation, new Set(dependencies));
        this.vertices.set(hash, vertex);
        this.frontier.add(hash);

        if (dependencies.length === 0) {
            this.root = hash;
            this.vertexInfo.set(hash, { parent: hash, depth: 0, ancestors: [hash] });
        } else {
            let maxDepthParent = dependencies[0];
            let maxDepth = this.vertexInfo.get(maxDepthParent)!.depth;

            for (let i = 1; i < dependencies.length; i++) {
                const depDepth = this.vertexInfo.get(dependencies[i])!.depth;
                if (depDepth > maxDepth) {
                    maxDepthParent = dependencies[i];
                    maxDepth = depDepth;
                }
            }

            const newDepth = maxDepth + 1;
            const ancestors = this.computeAncestors(hash, maxDepthParent, newDepth);
            this.vertexInfo.set(hash, { parent: maxDepthParent, depth: newDepth, ancestors });

            for (const dep of dependencies) {
                this.frontier.delete(dep);
            }
        }

        this.maxLog = Math.max(this.maxLog, Math.floor(Math.log2(this.vertexInfo.get(hash)!.depth || 1)));
        return hash;
    }

    // Time complexity: O(log n), Space complexity: O(log n)
    private computeAncestors(hash: Hash, parent: Hash, depth: number): Hash[] {
        const ancestors: Hash[] = new Array(Math.floor(Math.log2(depth)) + 1);
        ancestors[0] = parent;

        for (let i = 1; i < ancestors.length; i++) {
            const halfAncestor = ancestors[i - 1];
            if (halfAncestor) {
                ancestors[i] = this.vertexInfo.get(halfAncestor)!.ancestors[i - 1];
            }
        }

        return ancestors;
    }

    // Time complexity: O(log n), Space complexity: O(1)
    private getLCA(u: Hash, v: Hash): Hash {
        let uInfo = this.vertexInfo.get(u)!;
        let vInfo = this.vertexInfo.get(v)!;

        if (uInfo.depth < vInfo.depth) {
            [u, v] = [v, u];
            [uInfo, vInfo] = [vInfo, uInfo];
        }

        for (let i = this.maxLog; i >= 0; i--) {
            if (uInfo.depth - (1 << i) >= vInfo.depth) {
                u = uInfo.ancestors[i];
                uInfo = this.vertexInfo.get(u)!;
            }
        }

        if (u === v) return u;

        for (let i = this.maxLog; i >= 0; i--) {
            if (uInfo.ancestors[i] !== vInfo.ancestors[i]) {
                u = uInfo.ancestors[i];
                v = vInfo.ancestors[i];
                uInfo = this.vertexInfo.get(u)!;
                vInfo = this.vertexInfo.get(v)!;
            }
        }

        return uInfo.parent;
    }

    // Time complexity: O(n^2 * log n) worst case, typically better in practice
    // Space complexity: O(n)
    linearizeOps(): T[] {
        const order = this.topologicalSort();
        const result: T[] = [];
        let i = 0;

        while (i < order.length) {
            const anchor = order[i];
            let shouldKeepAnchor = true;
            let j = i + 1;

            while (j < order.length) {
                const moving = order[j];

                if (this.getLCA(anchor, moving) !== anchor) {
                    const op1 = this.vertices.get(anchor)!.operation;
                    const op2 = this.vertices.get(moving)!.operation;
                    const action = this.resolveConflicts(op1, op2);

                    switch (action) {
                        case ActionType.DropLeft:
                            shouldKeepAnchor = false;
                            j = order.length;  // Break out of inner loop
                            break;
                        case ActionType.DropRight:
                            order[j] = order[order.length - 1];
                            order.pop();
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

            if (shouldKeepAnchor) {
                result.push(this.vertices.get(anchor)!.operation);
                i++;
            } else {
                order[i] = order[order.length - 1];
                order.pop();
            }
        }

        return result;
    }

    // Time complexity: O(n), Space complexity: O(n)
    topologicalSort(): Hash[] {
        const visited = new Set<Hash>();
        const result: Hash[] = [];

        const dfs = (hash: Hash) => {
            if (visited.has(hash)) return;
            visited.add(hash);
            const vertex = this.vertices.get(hash)!;
            for (const dep of vertex.dependencies) {
                dfs(dep);
            }
            result.push(hash);
        };

        dfs(this.root);
        return result.reverse();
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

    // Time complexity: O(n), Space complexity: O(n)
    getAllVertices(): Vertex<T>[] {
        return Array.from(this.vertices.values());
    }
}