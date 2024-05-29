import { GCounter } from "../GCounter";

/// State-based PNCounter
export class PNCounter {
  private _increments: GCounter;
  private _decrements: GCounter;

  constructor(increments: GCounter, decrements: GCounter) {
    this._increments = increments;
    this._decrements = decrements;
  }

  value(): number {
    return this._increments.value() - this._decrements.value();
  }

  increments(): GCounter {
    return this._increments;
  }

  decrements(): GCounter {
    return this._decrements;
  }

  increment(node_id: string): void {
    this._increments.increment(node_id);
  }

  decrement(node_id: string): void {
    this._decrements.increment(node_id);
  }

  compare(peer_counter: PNCounter): boolean {
    return (
      this._increments.compare(peer_counter.increments()) &&
      this._decrements.compare(peer_counter.decrements())
    );
  }

  merge(peer_counter: PNCounter): void {
    this._increments.merge(peer_counter.increments());
    this._decrements.merge(peer_counter.decrements());
  }
}
