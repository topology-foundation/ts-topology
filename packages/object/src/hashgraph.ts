export interface IHashGraphDAG<O,T> {
  addNode(hash: Hash, operation: O, tick: T, dependecies: Hash[]);
  getFrontier(): Hash[];
  getDependencies(hash: Hash): Hash[];
  getOriginalState(): any;
  getOriginSet(): Array<Hash>;
  getOps(tick: T): O[];
  getLinearOps(): O[];
  getNode(hash: Hash): HashgraphNode<O, T> | undefined;
  getAllNodes(): HashgraphNode<O, T>[];
}

type Hash  = string;

class HashgraphNode<O, T> {
  readonly hash: Hash;
  readonly operation: O;
  readonly tick: T;
  readonly dependencies: Set<Hash>;

  constructor(hash: Hash, operation: O, tick: T, dependencies: Set<Hash> = new Set()) {
    this.hash = hash;
    this.operation = operation;
    this.tick = tick;
    this.dependencies = dependencies;
  }

  getDependeciesCount(): integer {
    this.depedencies.size
  }

  getDependencies(): Hash[] {
    [].concat(...this.dependencies)
  }
}

class HashgraphDAG<O,T> {
  private nodes: Map<Hash, HashgraphNode<T>> = new Map();
  private frontier: Set<Hash> = new Set();
  private originSet: Set<Hash> = new Set();
  private precedenceRules: Map<string, boolean> = new Map();
  private tickStore: Map<O, Hash> = new Map();

  constructor() {
      // could set the precedenceRules here
  }

  addNode(hash: Hash, operation: O, tick: T, dependencies: Hash[] = []): void {
    if (this.nodes.has(hash)) {
      throw new Error(`Node with hash ${hash} already exists`);
    }

    const dependenciesSet = new Set(dependencies);
    const node = new HashgraphNode(hash, operation, tick, dependenciesSet);

    this.nodes.set(hash, node);
    this.frontier.add(hash);
    this.tickStore[tick].push(hash);
    
    // if the node has no dependencies place it in the originSet
    if (dependencies.len() === 0) {
      this.originSet.set(hash, node);
    }

    for (const dependencyHash of dependencies) {
      const dependencyNode = this.nodes.get(dependencyHash);
      if (dependencyNode) {
        this.frontier.delete(dependencyHash);
      } else {
        throw new Error(`Dependency node ${dependencyHash} does not exist`);
      }
    }
  }

  getFrontier(): Hash[] {
    return Array.from(this.frontier);
  }

  getOriginSet(): Hash[] {
    return Array.from(this.originSet);
  }

  getDependences(hash: Hash): Hash[] {
    return this.nodes.get(hash).getDependencies();
  }

  getOps(tick: T): O[] {
    // fetch all the ops at the tick `tick`
    const nodeHashes = this.tickStore.get(tick);
    const ops = nodeHashes.map(hash => this.nodes.get(hash).operation);
    // apply conflict semantics
    const result = this.applyConflictSemantics(ops)

    return result
  }

  applyConflictSemantics(ops: O[]) {
    
  }

  getLinearOps(): O[] {
    const result: Hash[] = [];

    const outDegrees: Map<Hash, number> = new Map(); 
    const inverseDependencies : Map<Hash, Hash[]> = new Map();

    for (const [nodeHash, node] of this.nodes.entries()) {
      // Compute the out degrees of each node
      outDegrees[nodeHash] = node.getDependenciesCount();
    
      // compute the mapping that stores node -> [dependencies]
      const dependencies = node.getDependencies();
      for (const dependency of dependencies) {
        inverseDependencies[dependency].push(nodeHash); 
      }
    }

    // Initialize the queue
    const queue: Hash[] = [];
    outDegrees.forEach((key, value) => {
      if (value === 0) {
        queue.push(key);
      }
    }

    while (queue.length > 0) {
      const nodeHash = queue.shift();
      const nodeOp = this.nodes.get(nodeHash).operation;
      result.push(nodeOp);
      
      // Decrement the outDegree of each dependency by 1
      const dependencyHashes = inverseDependencies[nodeHash];
      const zeroOutDegreeDependencyOps: Map<O, Hash> = new Map();

      for (const dependencyHash of dependencyHashes) {
        const currentDegree = outDegrees[dependencyHash]; 
        outDegrees.set(dependencyHash, currentDegree - 1);
        
        if currentDegree - 1 === 0 {
          const op = this.nodes.get(dependencyHash).operation;
          zeroOutDegreeDependencyOps.set(op, dependencyHash);
        }
      }
      
      const dependencyOps = Array.from(zeroOutDegreeDependencyOps.keys());
      // apply conflict semantics to the dependencyOps
      const ops = this.applyConflictSemantics(dependencyOps);
      for (const op of ops) {
        queue.push(zeroOutDegreeDependencyOps.get(op));
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
