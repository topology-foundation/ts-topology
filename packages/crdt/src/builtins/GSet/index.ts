/* GSet with support for state and op changes */
class GSet<T> {
  set: Set<T>;
  constructor(set: Set<T>) {
    this.set = set;
  }
}

function gset_create<T>(set: Set<T> = new Set<T>()): GSet<T> {
  return new GSet<T>(set);
}

function gset_add<T>(gset: GSet<T>, element: T): void {
  gset.set.add(element);
}

function gset_lookup<T>(gset: GSet<T>, element: T): boolean {
  return gset.set.has(element);
}

function gset_compare<T>(gset: GSet<T>, peerSet: GSet<T>): boolean {
  return (gset.set.size == peerSet.set.size && gset.set.values().every(value => peerSet.set.has(value)));
}

function gset_merge<T>(gset: GSet<T>, peerSet: GSet<T>): void {
  //this._set = new Set<T>([...this._set, ...peerSet.set()]);
  peerSet.set.values().forEach((value) => {
    gset.set.add(value);
  });
}
