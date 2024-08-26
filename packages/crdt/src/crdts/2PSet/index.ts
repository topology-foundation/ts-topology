import type { GSet } from "../GSet/index.js";

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
