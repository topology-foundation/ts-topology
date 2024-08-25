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
		this.counts[nodeId] += amount;
	}

	compare(peerCounter: GCounter): boolean {
		return (
			this.counts.length === peerCounter.counts.length &&
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
