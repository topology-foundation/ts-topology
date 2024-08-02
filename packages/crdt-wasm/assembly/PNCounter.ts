import { GCounter } from "./GCounter";

export class PNCounter {
  private increments: GCounter;
  private decrements: GCounter;

  constructor() {
    this.increments = new GCounter();
    this.decrements = new GCounter();
  }

  increment(nodeId: string, amount: i32 = 1): void {
    this.increments.increment(nodeId, amount);
  }

  decrement(nodeId: string, amount: i32 = 1): void {
    this.decrements.increment(nodeId, amount);
  }

  value(): i32 {
    return this.increments.value() - this.decrements.value();
  }

  merge(other: PNCounter): void {
    this.increments.merge(other.increments);
    this.decrements.merge(other.decrements);
  }
}