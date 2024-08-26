export interface ElementTuple<T> {
	element: T;
	tag: number;
	nodeId: string;
}

/* Implementation of the Optimized Observed-Remove Set CRDT
  Based on the paper: https://pages.lip6.fr/Marek.Zawirski/papers/RR-8083.pdf
*/
export class OORSet<T> {
	elements: Set<ElementTuple<T>> = new Set<ElementTuple<T>>();
	summary: Map<string, number> = new Map<string, number>();
	nodeId = "";

	constructor(nodeId?: string, elements?: Set<ElementTuple<T>>) {
		if (nodeId !== undefined) {
			this.nodeId = nodeId;
			this.summary = new Map<string, number>([
				[this.nodeId, this.elements.size],
			]);
		}

		if (elements !== undefined) {
			this.elements = elements;
		}
	}

	lookup(element: T): boolean {
		return [...this.elements].some((elem) => elem.element === element);
	}

	add(nodeId: string, element: T): void {
		const tag: number = (this.summary.get(this.nodeId) ?? 0) + 1;
		this.summary.set(this.nodeId, tag);
		this.elements.add({ element, tag, nodeId: nodeId });
	}

	remove(element: T): void {
		for (const tuple of this.elements.values()) {
			if (tuple.element === element) {
				this.elements.delete(tuple); //removes element from the elements
			}
		}
	}

	// When comparing both element sets, it just needs to compare them one way because
	// the "tag" and "nodeId" are going to be unique for a given element so there are
	// not equal elements in the set before they're merged
	compare(peerSet: OORSet<T>): boolean {
		return (
			this.elements.size === peerSet.elements.size &&
			[...this.elements].every((value) => peerSet.elements.has(value))
		);
	}

	merge(peerSet: OORSet<T>): void {
		// place: [local, remote, both]
		// sets: [elements, removed]
		// existence: [in, notIn]
		const bothInElements = [...this.elements].filter((element) =>
			peerSet.elements.has(element),
		);
		const localInElementsRemoteNotInRemoved = [...this.elements].filter(
			(element) =>
				!peerSet.elements.has(element) &&
				element.tag > (peerSet.summary.get(element.nodeId) ?? 0),
		);
		const localNotInRemovedRemoteInElements = [...peerSet.elements].filter(
			(element) =>
				!this.elements.has(element) &&
				element.tag > (this.summary.get(element.nodeId) ?? 0),
		);

		this.elements = new Set<ElementTuple<T>>([
			...bothInElements,
			...localInElementsRemoteNotInRemoved,
			...localNotInRemovedRemoteInElements,
		]);
		this.elements = new Set(
			[...this.elements].filter((e) =>
				[...this.elements].every((e2) => e.tag > e2.tag),
			),
		);

		// update summary
		for (const e of peerSet.summary.entries()) {
			this.summary.set(e[0], Math.max(e[1], this.summary.get(e[0]) ?? 0));
		}
	}
}
