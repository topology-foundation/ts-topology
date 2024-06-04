/// GCounter with support for state and op changes
export class GCounter {
  private _globalCounter: number;
  // instead of standard incremental id for replicas
  // we map the counter with the node id
  private _counts: { [nodeId: string]: number };

  constructor(counts: { [nodeId: string]: number }) {
    this._globalCounter = Object.values(counts).reduce((a, b) => a + b, 0);
    this._counts = counts;
  }

  value(): number {
    return this._globalCounter;
  }

  increment(nodeId: string, amount: number): void {
    this._globalCounter += amount;
    this._counts[nodeId] += amount;
  }

  counts(): { [nodeKey: string]: number } {
    return this._counts;
  }

  compare(peerCounter: GCounter): boolean {
    for (let key in Object.keys(this._counts)) {
      if (this._counts[key] > peerCounter.counts()[key]) {
        return false;
      }
    }
    return true;
  }

  merge(peerCounter: GCounter): void {
    let temp: { [nodeKey: string]: number } = Object.assign(
      {},
      this._counts,
      peerCounter.counts(),
    );
    Object.keys(temp).forEach((key) => {
      this._counts[key] = Math.max(
        this._counts[key],
        peerCounter.counts()[key],
      );
    });
  }
}
