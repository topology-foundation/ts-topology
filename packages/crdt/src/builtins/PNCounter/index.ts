import { GCounter } from "../GCounter/index.js";

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

  increment(nodeId: string, amount: number): void {
    this._increments.increment(nodeId, amount);
  }

  decrement(nodeId: string, amount: number): void {
    this._decrements.increment(nodeId, amount);
  }

  compare(peerCounter: PNCounter): boolean {
    return (
      this._increments.compare(peerCounter.increments()) &&
      this._decrements.compare(peerCounter.decrements())
    );
  }

  merge(peerCounter: PNCounter): void {
    this._increments.merge(peerCounter.increments());
    this._decrements.merge(peerCounter.decrements());
  }
}