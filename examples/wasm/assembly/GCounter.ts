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
      const keys = other.counts.keys();
      for (let i = 0; i < keys.length; i++) {
        const nodeId = keys[i];
        if (this.counts.has(nodeId)) {
          this.counts.set(nodeId, Math.max(this.counts.get(nodeId), other.counts.get(nodeId)));
        } else {
          this.counts.set(nodeId, other.counts.get(nodeId));
        }
      }
    }
  }
  