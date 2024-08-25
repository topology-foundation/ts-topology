/// GSet with support for state and op changes
export class GSet<T> {
	set: Set<T>;

	constructor(set: Set<T>) {
		this.set = set;
	}

	add(element: T): void {
		this.set.add(element);
	}

	lookup(element: T): boolean {
		return this.set.has(element);
	}

	compare(peerSet: GSet<T>): boolean {
		return (
			this.set.size === peerSet.set.size &&
			[...this.set].every((value) => peerSet.set.has(value))
		);
	}

	merge(peerSet: GSet<T>): void {
		this.set = new Set<T>([...this.set, ...peerSet.set]);
	}
}
