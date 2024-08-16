import { sha256 } from "js-sha256";
import { todo } from "node:test";
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

  getOperation(): T {
    return this.operation;
  }
}
export enum ActionType {
  DropLeft,
  DropRight,
  Nop,
  Swap
}

export class HashGraphDAG<T> {
  private hashGraph: Map<Hash, HashGraphVertex<T>> = new Map();
  private frontier: Set<Hash> = new Set();
  private root: Hash = "";
  // private stateStore: Map<Hash, S> = new Map();
  private tickStore: Map<number, Hash[]> = new Map();
  private latestTick: number = 0;
  private resolveConflicts: (op1: T, op2: T) => ActionType;
  // private computeState: (vertexHash: Hash, operation: T) => S;

  constructor(resolveConflicts: (op1: T, op2: T) => ActionType) {
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
      this.root = vertexHash;
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

  getRoot(): Hash {
    return this.root;
  }

  getDependencies(hash: Hash): Hash[] {
    return this.hashGraph.get(hash)?.getDependencies() || [];
  }

  // getLinearOps(): T[] {
  //   const result: T[] = [];

  //   const outDegrees: Map<Hash, number> = new Map(); 
  //   const inverseDependencies : Map<Hash, Hash[]> = new Map();

  //   for (const [nodeHash, node] of this.hashGraph.entries()) {
  //     // Compute the out degrees of each node
  //     outDegrees.set(nodeHash, node.getDependeciesCount());
    
  //     // compute the mapping that stores node -> [dependencies]
  //     const dependencies = node.getDependencies();
  //     for (const dependency of dependencies) {
  //       inverseDependencies.set(dependency, [...inverseDependencies.get(dependency) || [], nodeHash]);
  //     }
  //   }

  //   // Initialize the queue
  //   const queue: Hash[] = [];
  //   outDegrees.forEach((value, key) => value === 0 && queue.push(key));

  //   while (queue.length > 0) {
  //     const nodeHash = queue.shift()!;
  //     const nodeOp = this.hashGraph.get(nodeHash)?.operation!;
  //     result.push(nodeOp);
      
  //     // Decrement the outDegree of each dependency by 1
  //     const dependentHashes = inverseDependencies.get(nodeHash) || [];
  //     // zeroOutDegreeDependencyOps is an inverse mapping (ops -> nodeHash) which 
  //     // is needed to get the nodeHash after applyConflictSemantics applied on the ops.
  //     const zeroOutDegreeDependentOps: Map<T, Hash> = new Map();

  //     for (const dependentHash of dependentHashes) {
  //       const currentDegree = outDegrees.get(dependentHash)!;
  //       outDegrees.set(dependentHash, currentDegree - 1);
        
  //       if (currentDegree - 1 === 0) {
  //         const op = this.hashGraph.get(dependentHash)?.operation!;
  //         zeroOutDegreeDependentOps.set(op, dependentHash);
  //       }
  //     }
      
  //     const dependentOps = Array.from(zeroOutDegreeDependentOps.keys());
  //     // apply conflict semantics to the dependencyOps
  //     const ops = this.resolveConflicts(dependentOps);
  //     for (const op of ops) {
  //       queue.push(zeroOutDegreeDependentOps.get(op)!);
  //     }
  //   }

  //   // Check if topological sort is possible (i.e., the graph is a DAG)
  //   // if (topologicalOrder.length !== nodes.size) {
  //   // throw new Error("Graph is not a DAG (contains a cycle)");
  //   //}

  //   return result;
  // }

  linearizeOps(): T[] {

    const inverseDependenciesMap: Map<Hash, Hash[]> = new Map();

    // Build inverse dependencies map
    for (const [nodeHash, node] of this.hashGraph.entries()) {
        node.getDependencies().forEach(dep => 
            inverseDependenciesMap.set(dep, [...(inverseDependenciesMap.get(dep) || []), nodeHash])
        );
    }

    // Build a light weight dependences map
    const dependenciesMap: Map<Hash, Hash[]> = new Map();
    this.hashGraph.forEach((vertex, vertexHash) => dependenciesMap.set(vertexHash, vertex.getDependencies()));

    // Get candidate sorted array
    let candidateSortArray = this._topologicalSort(this.root, inverseDependenciesMap);

    // Compute reachability for each vertex
    // refine the array using conflict semantics
    const reachabilityMap: Map<string, boolean> = new Map();
    let i = 0;
    while (i < candidateSortArray.length) {
      let vertex = candidateSortArray[i];
      // compute a reachability map for the vertex using forward and backward bfs.
      // only vertices not reachable can cause potential conflicts.
      this._computeReachabilityMap(vertex, dependenciesMap, inverseDependenciesMap, reachabilityMap);
      console.log("Vertex: ", vertex);
      // iterate over every vertex in the candidateSortArray and check for potential 
      // conflict with every vertex not in the reachabilityMap
      for (let j = i + 1; j < candidateSortArray.length; ++j) {
        const otherVertex = candidateSortArray[j];
        const key = `${vertex}-${otherVertex}`;
        // check for potential conflict
        if (!reachabilityMap.has(key)) {
          const op1 = this.hashGraph.get(vertex)?.getOperation()!;
          const op2 = this.hashGraph.get(otherVertex)?.getOperation()!;
          const action = this.resolveConflicts(op1, op2);
          switch (action) {
            case ActionType.DropLeft:
              candidateSortArray.splice(i, 1);
              break;
            case ActionType.DropRight:
              candidateSortArray.splice(j, 1);
              break;
            case ActionType.Nop:
              ++i;
              break;
            case ActionType.Swap:
              [candidateSortArray[i], candidateSortArray[j]] = [candidateSortArray[j], candidateSortArray[i]];
              ++i;
          }
          // if any action was taken then break out of the inner loop.
        }
      }
    }
    let linearOps = candidateSortArray.map((hash) => this.hashGraph.get(hash)?.getOperation()!);

    return linearOps;
  }

  _computeReachabilityMap(
    startNodeHash: Hash,
    hashGraph: Map<Hash, Hash[]>,
    inverseDependencies: Map<Hash, Hash[]>,
    reachabilityMap: Map<string, boolean>
): void {
    const visited = new Set<Hash>();

    const dfs = (nodeHash: Hash, isBackward: boolean) => {
        if (visited.has(nodeHash)) return;
        visited.add(nodeHash);
        visited.forEach(node => reachabilityMap.set(`${startNodeHash}-${node}`, true));
        const neighbors = isBackward ? hashGraph.get(nodeHash) : inverseDependencies.get(nodeHash);
        neighbors?.forEach(neighbor => dfs(neighbor, isBackward));
    };

    dfs(startNodeHash, true);  // Backward DFS
    visited.clear();
    dfs(startNodeHash, false); // Forward DFS
    reachabilityMap.set(`${startNodeHash}-${startNodeHash}`, true); // Self-reachability
}

  _topologicalSort(startNodeHash: Hash, dag: Map<Hash, Hash[]>): Hash[] {
    const visited = new Set<Hash>();
    const result: Hash[] = [];

    function dfs(nodeHash: Hash) {
        if (visited.has(nodeHash)) return; // Return if already visited
        visited.add(nodeHash);
        result.push(nodeHash); // Add to result

        // Recursively visit dependencies
        (dag.get(nodeHash) || []).forEach(dfs);
    }

    dfs(startNodeHash); // Start DFS from the given node
    return result; 
}


  getVertex(vertexHash: Hash): HashGraphVertex<T> | undefined {
    return this.hashGraph.get(vertexHash);
  }

  getAllVertices(): HashGraphVertex<T>[] {
    return Array.from(this.hashGraph.values());
  }
}
