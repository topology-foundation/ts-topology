/// GCounter with support for state and op changes
export class GCounter {
  private _global_counter: number;
  // instead of standard incremental id for replicas
  // we map the counter with the node id
  private _counts: { [node_id: string]: number };

  constructor(counts: { string: number }) {
    this._global_counter = Object.values(counts).reduce((a, b) => a + b, 0);
    this._counts = counts;
  }

  value(): number {
    return this._global_counter;
  }

  increment(node_id: string, amount: number): void {
    this._global_counter += amount;
    this._counts[node_id] += amount;
  }

  counts(): { [node_key: string]: number } {
    return this._counts;
  }

  compare(peer_counter: GCounter): boolean {
    for (let key in Object.keys(this._counts)) {
      if (this._counts[key] <= peer_counter.counts()[key]) {
        return true;
      }
    }
    return false;
  }

  merge(peer_counter: GCounter): void {
    let temp: { [node_key: string]: number } = Object.assign(
      {},
      this._counts,
      peer_counter.counts(),
    );
    Object.keys(temp).forEach((key) => {
      this._counts[key] = Math.max(
        this._counts[key],
        peer_counter.counts()[key],
      );
    });
  }
}
