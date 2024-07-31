export class GCounter {
  private counts: Map<string, i32>;

  constructor() {
    this.counts = new Map();
  }

  increment(nodeId: string, value: i32): void {
    if (this.counts.has(nodeId)) {
      this.counts.set(nodeId, this.counts.get(nodeId) + value);
    } else {
      this.counts.set(nodeId, value);
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
      if (this.counts.has(key)) {
        this.counts.set(key, Mathf.max(this.counts.get(key) as f32, other.counts.get(key) as f32) as i32);
      } else {
        this.counts.set(key, other.counts.get(key));
      }
    }
  }
}
