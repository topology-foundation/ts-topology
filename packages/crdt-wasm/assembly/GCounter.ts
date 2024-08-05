export class GCounter {
  private counts: Map<string, i32>;

  constructor() {
    this.counts = new Map<string, i32>();
  }

  increment(nodeId: string, amount: i32 = 1): void {
    if (this.counts.has(nodeId)) {
      this.counts.set(nodeId, this.counts.get(nodeId) + amount);
    } else {
      this.counts.set(nodeId, amount);
    }
  }

  value(): i32 {
    let sum: i32 = 0;
    const keys = this.counts.keys();
    for (let i = 0; i < keys.length; i++) {
      sum += this.counts.get(keys[i]);
    }
    return sum;
  }

  merge(other: GCounter): void {
    const otherKeys = other.counts.keys();
    for (let i = 0; i < otherKeys.length; i++) {
      const key = otherKeys[i];
      if (!this.counts.has(key) || other.counts.get(key) > this.counts.get(key)) {
        this.counts.set(key, other.counts.get(key));
      }
    }
  }
}

let gCounterInstances: GCounter[] = [];

export function createGCounter(): usize {
  const counter = new GCounter();
  gCounterInstances.push(counter);
  return gCounterInstances.length - 1;
}

export function incrementCounter(counterPtr: usize, nodeId: string, amount: i32): void {
  assert(counterPtr < gCounterInstances.length, "Invalid GCounter pointer");
  gCounterInstances[counterPtr].increment(nodeId, amount);
}

export function getCounterValue(counterPtr: usize): i32 {
  assert(counterPtr < gCounterInstances.length, "Invalid GCounter pointer");
  return gCounterInstances[counterPtr].value();
}

export function mergeCounters(counterPtr: usize, otherPtr: usize): void {
  assert(counterPtr < gCounterInstances.length, "Invalid GCounter pointer");
  assert(otherPtr < gCounterInstances.length, "Invalid GCounter pointer");
  gCounterInstances[counterPtr].merge(gCounterInstances[otherPtr]);
}
