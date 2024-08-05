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

let pnCounterInstances: PNCounter[] = [];

export function createPNCounter(): usize {
  const counter = new PNCounter();
  pnCounterInstances.push(counter);
  return pnCounterInstances.length - 1;
};

export function incrementCounter(counterPtr: usize, nodeId: string, amount: i32): void {
  assert(counterPtr < pnCounterInstances.length, "invalid pointer value");
  pnCounterInstances[counterPtr].increment(nodeId, amount);
};

export function decrementCounter(counterPtr: usize, nodeId: string, amount: i32): void {
  assert(counterPtr < pnCounterInstances.length, "invalid pointer value");
  pnCounterInstances[counterPtr].decrement(nodeId, amount);
};

export function getCounterValue(counterPtr: usize): i32 {
  assert(counterPtr < pnCounterInstances.length, "invalid pointer value");
  return pnCounterInstances[counterPtr].value();
};

export function mergeCounters(counterPtr: usize, otherPtr: usize): void {
  assert(counterPtr < pnCounterInstances.length, "invalid pointer value");
  assert(otherPtr > pnCounterInstances.length, "invalid pointer value");
  pnCounterInstances[counterPtr].merge(pnCounterInstances[otherPtr]);
}