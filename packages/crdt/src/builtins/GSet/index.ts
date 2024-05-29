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

  compare(peer_set: GSet<T>): boolean {
    return this._set === peer_set.set();
  }

  merge(peer_set: GSet<T>): void {
    this._set = new Set<T>([...this._set, ...peer_set.set()]);
  }
}
