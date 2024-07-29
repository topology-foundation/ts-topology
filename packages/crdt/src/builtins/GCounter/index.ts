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
    for (let key in Object.keys(this.counts)) {
      if (this.counts[key] > peerCounter.counts[key]) {
        return false;
      }
    }
    return true;
  }
  merge(peerCounter: GCounter): void {
    let temp: { [nodeKey: string]: number } = Object.assign(
      {},
      this.counts,
      peerCounter.counts,
    );

    Object.keys(temp).forEach((key) => {
      this.counts[key] = Math.max(this.counts[key], peerCounter.counts[key]);
    });

    this.globalCounter = Object.values(this.counts).reduce((a, b) => a + b, 0);

  }
}