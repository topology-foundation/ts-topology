import { sha256 } from "js-sha256";
export interface IHashGraphDAG<T> {
  addVertex(hash: Hash, operation: T, tick: number, dependecies: Hash[]): void;
  getFrontier(): Hash[];
  getDependencies(hash: Hash): Hash[];
  getOriginSet(): Hash[];
  computeHash(op: T, dependencies: Hash[]): Hash;
  getLinearOps(): T[];
  getVertex(hash: Hash): HashGraphVertex<T> | undefined;
  getAllVertices(): HashGraphVertex<T>[];
}

type Hash  = string;

export class HashGraphVertex<T> {
  readonly hash: Hash;
  readonly operation: T;
  readonly dependencies: Set<Hash>;

  constructor(hash: Hash, operation: T, dependencies: Set<Hash> = new Set()) {
    this.hash = hash;
    this.operation = operation;
    this.dependencies = dependencies;
  }

  getDependeciesCount(): number {
    return this.dependencies.size;
  }

  getDependencies(): Hash[] {
    return [...this.dependencies];
  }
}

export class HashGraphDAG<T> {
  private hashGraph: Map<Hash, HashGraphVertex<T>> = new Map();
  private frontier: Set<Hash> = new Set();
  private originSet: Set<Hash> = new Set();
  // private stateStore: Map<Hash, S> = new Map();
  private tickStore: Map<number, Hash[]> = new Map();
  private latestTick: number = 0;
  private resolveConflicts: (ops: T[]) => T[];
  // private computeState: (vertexHash: Hash, operation: T) => S;

  constructor(resolveConflicts: (ops: T[]) => T[]) {
      // could set the precedenceRules here
      this.resolveConflicts = resolveConflicts;
  }

  computeHash(op: T, dependencies: Hash[]): Hash {
    // Serialize the operation and dependencies
    const serializedOperation = JSON.stringify(op);
    const serializedDependencies = JSON.stringify(dependencies);

    // Concatenate the serialized strings
    const combined = `${serializedOperation}|${serializedDependencies}`;

    // Compute the BLAKE3 hash
    const hashValue = sha256(combined);

    // Return the hash as a hexadecimal string
    return hashValue;
  }

  addVertex(operation: T, dependencies: Hash[] = []): Hash {
    
    // compute the vertex hash
    const vertexHash: Hash = this.computeHash(operation, dependencies);

    if (this.hashGraph.has(vertexHash)) {
      console.log(`Node with hash ${vertexHash} already exists`);
    }

    const dependenciesSet = new Set(dependencies);
    const node = new HashGraphVertex(vertexHash, operation, dependenciesSet);

    this.hashGraph.set(vertexHash, node);
    this.frontier.add(vertexHash);
    // this.tickStore.set(tick, [...(this.tickStore.get(tick) || []), hash]);
    
    // if the node has no dependencies place it in the originSet
    if (dependencies.length === 0) {
      this.originSet.add(vertexHash);
    }

    for (const dependencyHash of dependencies) {
      const dependencyNode = this.hashGraph.get(dependencyHash);
      if (dependencyNode) {
        this.frontier.delete(dependencyHash);
      } else {
        console.log(`Dependency node ${dependencyHash} does not exist`);
      }
    }
    return vertexHash;
  }

  getFrontier(): Hash[] {
    return Array.from(this.frontier);
  }

  getOriginSet(): Hash[] {
    return Array.from(this.originSet);
  }

  getDependencies(hash: Hash): Hash[] {
    return this.hashGraph.get(hash)?.getDependencies() || [];
  }

  getLinearOps(): T[] {
    const result: T[] = [];

    const outDegrees: Map<Hash, number> = new Map(); 
    const inverseDependencies : Map<Hash, Hash[]> = new Map();

    for (const [nodeHash, node] of this.hashGraph.entries()) {
      // Compute the out degrees of each node
      outDegrees.set(nodeHash, node.getDependeciesCount());
    
      // compute the mapping that stores node -> [dependencies]
      const dependencies = node.getDependencies();
      for (const dependency of dependencies) {
        inverseDependencies.set(dependency, [...inverseDependencies.get(dependency) || [], nodeHash]);
      }
    }

    // Initialize the queue
    const queue: Hash[] = [];
    outDegrees.forEach((value, key) => value === 0 && queue.push(key));

    while (queue.length > 0) {
      const nodeHash = queue.shift()!;
      const nodeOp = this.hashGraph.get(nodeHash)?.operation!;
      result.push(nodeOp);
      
      // Decrement the outDegree of each dependency by 1
      const dependentHashes = inverseDependencies.get(nodeHash) || [];
      // zeroOutDegreeDependencyOps is an inverse mapping (ops -> nodeHash) which 
      // is needed to get the nodeHash after applyConflictSemantics applied on the ops.
      const zeroOutDegreeDependentOps: Map<T, Hash> = new Map();

      for (const dependentHash of dependentHashes) {
        const currentDegree = outDegrees.get(dependentHash)!;
        outDegrees.set(dependentHash, currentDegree - 1);
        
        if (currentDegree - 1 === 0) {
          const op = this.hashGraph.get(dependentHash)?.operation!;
          zeroOutDegreeDependentOps.set(op, dependentHash);
        }
      }
      
      const dependentOps = Array.from(zeroOutDegreeDependentOps.keys());
      // apply conflict semantics to the dependencyOps
      const ops = this.resolveConflicts(dependentOps);
      for (const op of ops) {
        queue.push(zeroOutDegreeDependentOps.get(op)!);
      }
    }

    // Check if topological sort is possible (i.e., the graph is a DAG)
    // if (topologicalOrder.length !== nodes.size) {
    // throw new Error("Graph is not a DAG (contains a cycle)");
    //}

    return result;
  }

  getVertex(vertexHash: Hash): HashGraphVertex<T> | undefined {
    return this.hashGraph.get(vertexHash);
  }

  getAllVertices(): HashGraphVertex<T>[] {
    return Array.from(this.hashGraph.values());
  }
}
