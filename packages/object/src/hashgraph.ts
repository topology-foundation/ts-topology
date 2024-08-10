export interface IHashGraphDAG<T> {
  addNode(hash: Hash, operation: T, tick: number, dependecies: Hash[]): void;
  getFrontier(): Hash[];
  getDependencies(hash: Hash): Hash[];
  getOriginalState(): any;
  getOriginSet(): Hash[];
  getOps(tick: number): T[];
  getLinearOps(): T[];
  getNode(hash: Hash): HashgraphNode<T> | undefined;
  getAllNodes(): HashgraphNode<T>[];
}

type Hash  = string;

class HashgraphNode<T> {
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

class HashgraphDAG<T> {
  private nodes: Map<Hash, HashgraphNode<T>> = new Map();
  private frontier: Set<Hash> = new Set();
  private originSet: Set<Hash> = new Set();
  private precedenceRules: Map<string, boolean> = new Map();
  private tickStore: Map<number, Hash[]> = new Map();
  private latestTick: number = 0;

  constructor() {
      // could set the precedenceRules here
  }

  addNode(hash: Hash, operation: T, tick: number, dependencies: Hash[] = []): void {
    if (this.nodes.has(hash)) {
      console.log(`Node with hash ${hash} already exists`);
    }

    const dependenciesSet = new Set(dependencies);
    const node = new HashgraphNode(hash, operation, dependenciesSet);

    this.nodes.set(hash, node);
    this.frontier.add(hash);
    this.tickStore.set(tick, [...(this.tickStore.get(tick) || []), hash]);
    
    // if the node has no dependencies place it in the originSet
    if (dependencies.length === 0) {
      this.originSet.add(hash);
    }

    for (const dependencyHash of dependencies) {
      const dependencyNode = this.nodes.get(dependencyHash);
      if (dependencyNode) {
        this.frontier.delete(dependencyHash);
      } else {
        console.log(`Dependency node ${dependencyHash} does not exist`);
      }
    }
  }

  getFrontier(): Hash[] {
    return Array.from(this.frontier);
  }

  getOriginSet(): Hash[] {
    return Array.from(this.originSet);
  }

  getDependencies(hash: Hash): Hash[] {
    return this.nodes.get(hash)?.getDependencies() || [];
  }

  getOps(tick: number): T[] {
    // fetch all the ops at the tick `tick`
    const nodeHashes = this.tickStore.get(tick) ?? [];
    const ops = nodeHashes.map(hash => this.nodes.get(hash)?.operation!);
    // apply conflict semantics
    const result = this.applyConflictSemantics(ops)

    return result
  }

  applyConflictSemantics(ops: T[]): T[] {
    return ops;
  }

  getLinearOps(): T[] {
    const result: T[] = [];

    const outDegrees: Map<Hash, number> = new Map(); 
    const inverseDependencies : Map<Hash, Hash[]> = new Map();

    for (const [nodeHash, node] of this.nodes.entries()) {
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
      const nodeOp = this.nodes.get(nodeHash)?.operation!;
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
          const op = this.nodes.get(dependentHash)?.operation!;
          zeroOutDegreeDependentOps.set(op, dependentHash);
        }
      }
      
      const dependentOps = Array.from(zeroOutDegreeDependentOps.keys());
      // apply conflict semantics to the dependencyOps
      const ops = this.applyConflictSemantics(dependentOps);
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

  getNode(hash: Hash): HashgraphNode<T> | undefined {
    return this.nodes.get(hash);
  }

  getAllNodes(): HashgraphNode<T>[] {
    return Array.from(this.nodes.values());
  }
}
