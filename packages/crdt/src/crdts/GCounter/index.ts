/// GCounter with support for state and op changes
export class GCounter {
	globalCounter: number;
	// instead of standard incremental id for replicas
	// we map the counter with the node id
	counts: { [nodeId: string]: number };

	constructor(counts: { [nodeId: string]: number }) {
		this.globalCounter = Object.values(counts).reduce((a, b) => a + b, 0);
		this.counts = counts;
	}

	value(): number {
		return this.globalCounter;
	}

	increment(nodeId: string, amount: number): void {
		this.globalCounter += amount;
		this.counts[nodeId] = (this.counts[nodeId] || 0) + amount;
	}

	compare(peerCounter: GCounter): boolean {
		return (
			Object.keys(this.counts).length === Object.keys(peerCounter.counts).length &&
			Object.keys(this.counts).every(
				(key) => this.counts[key] <= peerCounter.counts[key],
			)
		);
	}

	merge(peerCounter: GCounter): void {
		const temp: { [nodeKey: string]: number } = Object.assign(
			{},
			this.counts,
			peerCounter.counts,
		);

		for (const key of Object.keys(temp)) {
			this.counts[key] = Math.max(
				this.counts[key] || 0,
				peerCounter.counts[key] || 0,
			);
		}

		this.globalCounter = Object.values(this.counts).reduce((a, b) => a + b, 0);
	}
}

/// AssemblyScript functions
export function gcounter_create(counts: { [nodeId: string]: number }): GCounter {
	return new GCounter(counts);
}

export function gcounter_value(counter: GCounter): number {
	return counter.value();
}

export function gcounter_increment(counter: GCounter, nodeId: string, amount: number): void {
	counter.increment(nodeId, amount);
}

export function gcounter_compare(counter: GCounter, peerCounter: GCounter): boolean {
	return counter.compare(peerCounter);
}

export function gcounter_merge(counter: GCounter, peerCounter: GCounter): void {
	counter.merge(peerCounter);
}
