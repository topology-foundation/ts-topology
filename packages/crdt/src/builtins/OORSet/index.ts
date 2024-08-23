export interface ElementTuple<T> {
  element: T,
  tag: number,
  nodeId: string
}

/* Implementation of the Optimized Observed-Remove Set CRDT
  Based on the paper: https://pages.lip6.fr/Marek.Zawirski/papers/RR-8083.pdf
*/
export class OORSet<T> {
  private _elements: Set<ElementTuple<T>>;
  private _summary: Map<string, number>;
  public nodeId: string;

  constructor(elements: Set<ElementTuple<T>>, nodeId: string) {
    this._elements = elements;
    this.nodeId = nodeId;
    this._summary = new Map<string, number>([[this.nodeId, 0]]);
  }

  lookup(element: T): boolean {
    return [...this._elements].some(elem => elem.element === element);
  }

  add(element: T): void {
    let tag: number = this._summary.get(this.nodeId)! + 1;
    this._summary.set(this.nodeId, tag);
    this._elements.add({ element, tag, nodeId: this.nodeId });
  }

  remove(element: T): void {
    for (let tuple of this._elements.values()) {
      if (tuple.element === element) {
        this._elements.delete(tuple); //removes element from the elements
      }
    }
  }

  getElements(): Set<ElementTuple<T>> {
    return this._elements;
  }

  getSummary(): Map<string, number> {
    return this._summary;
  }

  //here I just compare the elements set
  compare(peerSet: OORSet<T>): boolean {
    return (this._elements.size == peerSet.getElements().size &&
      [...this._elements].every((value) => peerSet.getElements().has(value)));
  }

  merge(peerSet: OORSet<T>): void {
    // place: [local, remote, both]
    // sets: [elements, removed]
    // existence: [in, notIn]
    let bothInElements = [...this._elements].filter((element) => peerSet.getElements().has(element));
    let localInElementsRemoteNotInRemoved = [...this._elements].filter((element) =>
      !peerSet.getElements().has(element) && element.tag > peerSet.getSummary().get(element.nodeId)!
    );
    let localNotInRemovedRemoteInElements = [...peerSet._elements].filter((element) =>
      !this._elements.has(element) && element.tag > this.getSummary().get(element.nodeId)!
    );

    this._elements = new Set<ElementTuple<T>>([...bothInElements, ...localInElementsRemoteNotInRemoved, ...localNotInRemovedRemoteInElements]);
    this._elements = new Set(
      [...this._elements].filter((e) =>
        [...this._elements].every((e2) => e.tag > e2.tag)
      )
    );

    // update summary
    for (let e of peerSet.getSummary().entries()) {
      this._summary.set(e[0], Math.max(e[1], this._summary.get(e[0])!));
    }
  }
}
