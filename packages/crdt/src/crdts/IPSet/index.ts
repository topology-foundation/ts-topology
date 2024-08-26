import { GCounter } from "../GCounter/index.js";

/// State-based infinite-phase set (IPSet)
export class IPSet<T> {
	// Grow-only mapping of elements to GCounters
	private _counters: Map<T, GCounter>;

	// State:
	// - an element exists in the IPSet if _counter[element] exists and is an odd number
	// - otherwise the element doesn't exist in the IPSet

	constructor(counters: Map<T, GCounter> = new Map()) {
		this._counters = counters;
	}

	counters(): Map<T, GCounter> {
		return this._counters;
	}

	add(nodeId: string, element: T): void {
		if (!this._counters.has(element)) {
			this._counters.set(element, new GCounter({ [nodeId]: 1 }));
		} else if ((this._counters.get(element)?.value() ?? 0) % 2 === 0) {
			this._counters.get(element)?.increment(nodeId, 1);
		}
	}

	remove(nodeId: string, element: T): void {
		if (
			this._counters.has(element) &&
			(this._counters.get(element)?.value() ?? 0) % 2 === 1
		) {
			this._counters.get(element)?.increment(nodeId, 1);
		}
	}

	contains(element: T): boolean {
		if (this._counters.has(element)) {
			return (this._counters.get(element)?.value() ?? 0) % 2 === 1;
		}
		return false;
	}

	set(): Set<T> {
		const result = new Set<T>();
		for (const [element, counter] of this._counters.entries()) {
			if (counter.value() % 2 === 1) {
				result.add(element);
			}
		}
		return result;
	}

	compare(peerSet: IPSet<T>): boolean {
		// Returns true if peerSet includes all operations that were performed on the given IPSet and possibly more.
		// this._counters has to be a subset of peerSet._counters
		// and for each element, the value of the counter in this._counters has to be less than or equal to the value of the counter in peerSet._counters
		return [...this._counters.keys()].every(
			(element) =>
				peerSet.counters().has(element) &&
				(this._counters.get(element)?.value() ?? 0) <=
					(peerSet.counters().get(element)?.value() ?? 0),
		);
	}

	merge(peerSet: IPSet<T>): void {
		for (const [element, counter] of peerSet._counters.entries()) {
			// if element is not in local replica, set local counter for element to counter
			// otherwise, merge the counters
			if (!this._counters.has(element)) {
				this._counters.set(element, counter);
			} else {
				this._counters.get(element)?.merge(counter);
			}
		}
	}
}
