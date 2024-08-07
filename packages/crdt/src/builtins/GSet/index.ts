/* GSet with support for state and op changes */
export class GSet<T> {
  set: Set<T>;

  constructor(set: Set<T> = new Set<T>()) {
    this.set = set;
  }

  add(element: T): void {
    let set = this.set;
    set.add(element);
    this.set = set;
  }

  lookup(element: T): boolean {
    return this.set.has(element);
  }

  compare(peerSet: GSet<T>): boolean {
    return (this.set.size == peerSet.set.size && [...this.set].every(value => peerSet.set.has(value)));
  }

  merge(peerSet: GSet<T>): void {
    this.set = new Set<T>([...this.set, ...peerSet.set]);
  }
}

/// AssemblyScript functions
function gset_create<T>(set: Set<T> = new Set<T>()): GSet<T> {
  return new GSet<T>(set);
}

export function gset_add<T>(gset: GSet<T>, element: T): void {
  gset.add(element);
}

function gset_lookup<T>(gset: GSet<T>, element: T): boolean {
  return gset.lookup(element);
}

export function gset_compare<T>(gset: GSet<T>, peerSet: GSet<T>): boolean {
  // @ts-ignore
  return (gset.set.size == peerSet.set.size && gset.set.values().every(value => peerSet.set.has(value)));
}

export function gset_merge<T>(gset: GSet<T>, peerSet: GSet<T>): void {
  // @ts-ignore
  peerSet.set.values().forEach((value) => {
    gset.set.add(value);
  });
}
