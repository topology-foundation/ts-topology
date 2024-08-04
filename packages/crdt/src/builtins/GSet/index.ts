/// GSet with support for state and op changes
export class GSet<T> {
  private _set: Set<T>;

  constructor(set: Set<T>) {
    this._set = set;
  }

  add(element: T): void {
    this._set.add(element);
  }

  lookup(element: T): boolean {
    return this._set.has(element);
  }

  set(): Set<T> {
    return this._set;
  }

  compare(peerSet: GSet<T>): boolean {
    return (this._set.size == peerSet.set().size && [...this._set].every(value => peerSet.set().has(value)));
  }

  merge(peerSet: GSet<T>): void {
    this._set = new Set<T>([...this._set, ...peerSet.set()]);
  }
}