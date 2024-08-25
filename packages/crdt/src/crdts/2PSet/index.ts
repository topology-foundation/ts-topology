import { GSet } from "../GSet/index.js";

/// 2PSet with support for state and op changes
export class TwoPSet<T> {
  private _adds: GSet<T>;
  private _removes: GSet<T>;

  constructor(adds: GSet<T>, removes: GSet<T>) {
    this._adds = adds;
    this._removes = removes;
  }

  lookup(element: T): boolean {
    return this._adds.lookup(element) && !this._removes.lookup(element);
  }

  add(element: T): void {
    this._adds.add(element);
  }

  remove(element: T): void {
    this._removes.add(element);
  }

  adds(): GSet<T> {
    return this._adds;
  }

  removes(): GSet<T> {
    return this._removes;
  }

  compare(peerSet: TwoPSet<T>): boolean {
    return (
      this._adds.compare(peerSet.adds()) &&
      this._removes.compare(peerSet.removes())
    );
  }

  merge(peerSet: TwoPSet<T>): void {
    this._adds.merge(peerSet.adds());
    this._removes.merge(peerSet.removes());
  }
}

/// AssemblyScript functions
export function twopset_create<T>(adds: GSet<T>, removes: GSet<T>): TwoPSet<T> {
  return new TwoPSet<T>(adds, removes);
}

export function twopset_lookup<T>(set: TwoPSet<T>, element: T): boolean {
  return set.lookup(element);
}

export function twopset_add<T>(set: TwoPSet<T>, element: T): void {
  set.add(element);
}

export function twopset_remove<T>(set: TwoPSet<T>, element: T): void {
  set.remove(element);
}

export function twopset_adds<T>(set: TwoPSet<T>): GSet<T> {
  return set.adds();
}

export function twopset_removes<T>(set: TwoPSet<T>): GSet<T> {
  return set.removes();
}

export function twopset_compare<T>(set: TwoPSet<T>, peerSet: TwoPSet<T>): boolean {
  return set.compare(peerSet);
}

export function twopset_merge<T>(set: TwoPSet<T>, peerSet: TwoPSet<T>): void {
  set.merge(peerSet);
}