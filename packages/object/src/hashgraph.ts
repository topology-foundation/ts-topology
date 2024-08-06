export interface IHashGraphDAG {
  getFrontier(): Array<string>;
  getDependencies(id: string): Array<string>;
  addNode(op: string, dependecies: Array<string>);
  getOriginalState(): any;
  getOriginSet(): Array<string>;
  getSerializedOperations(): Array<string>;

}

class HashgraphNode<T> {
  readonly hash: Hash;
  readonly operation: T;
  readonly dependencies: Set<Hash>;

  constructor(hash: Hash, operation: T, operation: Set<Hash> = new Set()) {
    this.hash = hash;
    this.operation = operation;
    this.dependencies = dependencies;
  }
}

class HashgraphDAG<T> {
  private nodes: Map<Hash, HashgraphNode<T>> = new Map();
  private frontier: Set<Hash> = new Set();
  private originSet: Set<Hash> = new Set();
  private precedenceRules: Map<string, boolean> = new Map();

  constructor(precedenceRules: any) {
    // precedence rules for conflict-semantics
    // precedenceRules is of the form [(opA, opB, true), (opA, opC, false), ..]
    // Create a mapping for each rule as (opA, opB, true) -> precedenceRules[opA || opB] = true, precedenceRules[opB || opA] = false.
    for (const entry of precedenceRules) {
      const (opA, opB, isPrecede) = entry;
      this.precedenceRules[opA.concat(opB)] = isPrecede;
      this.precedenceRules[opB.concat(opA)] = !isPrecede;
    }
  }

  addNode(hash: Hash, operation: T, dependencies: Hash[] = []): void {
    if (this.nodes.has(hash)) {
      throw new Error(`Node with hash ${hash} already exists`);
    }

    const dependenciesSet = new Set(dependencies);
    const node = new HashgraphNode(hash, operation, dependenciesSet);

    this.nodes.set(hash, node);
    this.frontier.add(hash);

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

  getSerializedOperations(): Hash[] {
    const visited = new Set<Hash>();
    const result: Hash[] = [];

    const visit = (hash: Hash) => {
      if (!visited.has(hash)) {
        visited.add(hash);
        const node = this.nodes.get(hash)!;
        for (const parentHash of node.parents) {
          visit(parentHash);
        }
        result.unshift(hash);
      }
    };

    for (const hash of this.nodes.keys()) {
      visit(hash);
    }

    return result;
  }

  getNode(hash: Hash): HashgraphNode<T> | undefined {
    return this.nodes.get(hash);
  }

  getAllNodes(): HashgraphNode<T>[] {
    return Array.from(this.nodes.values());
  }
}
