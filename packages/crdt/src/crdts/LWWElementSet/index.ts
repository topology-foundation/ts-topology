export enum Bias {
	ADD = 0,
	REMOVE = 1,
}

export class LWWElementSet<T> {
	private _adds: Map<T, number>;
	private _removes: Map<T, number>;
	public _bias: Bias;

	constructor(adds: Map<T, number>, removes: Map<T, number>, bias: Bias) {
		this._adds = adds;
		this._removes = removes;
		this._bias = bias;
	}

	lookup(element: T): boolean {
		const addTimestamp = this._adds.get(element);
		if (addTimestamp === undefined) {
			return false;
		}

		const removeTimestamp = this._removes.get(element);
		if (removeTimestamp === undefined) {
			return true;
		}
		if (addTimestamp > removeTimestamp) {
			return true;
		}
		if (addTimestamp - removeTimestamp === 0 && this._bias === Bias.ADD) {
			return true;
		}

		return false;
	}

	add(element: T): void {
		this._adds.set(element, Date.now());
	}

	remove(element: T): void {
		this._removes.set(element, Date.now());
	}

	getAdds(): Map<T, number> {
		return this._adds;
	}

	getRemoves(): Map<T, number> {
		return this._removes;
	}

	compare(peerSet: LWWElementSet<T>): boolean {
		return (
			compareSets(this._adds, peerSet._adds) &&
			compareSets(this._removes, peerSet._removes)
		);
	}

	merge(peerSet: LWWElementSet<T>): void {
		for (const [element, timestamp] of peerSet._adds.entries()) {
			const thisTimestamp = this._adds.get(element);
			if (!thisTimestamp || thisTimestamp < timestamp) {
				this._adds.set(element, timestamp);
			}
		}
		for (const [element, timestamp] of peerSet._removes.entries()) {
			const thisTimestamp = this._removes.get(element);
			if (!thisTimestamp || thisTimestamp < timestamp) {
				this._removes.set(element, timestamp);
			}
		}
	}
}

function compareSets<T>(set1: Map<T, number>, set2: Map<T, number>): boolean {
	return (
		set1.size === set2.size && [...set1.keys()].every((key) => set2.has(key))
	);
}
