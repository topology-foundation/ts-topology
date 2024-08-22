/// AddWinsSet with support for state and op changes
export class AddWinsSet<T> {
  private state: Map<T, number>;

  constructor() {
    this.state = new Map();
  }

  add(value: T): void {
    this.state.set(value, (this.state.get(value) || 0) + 1);
  }

  remove(value: T): void {
    // We don't actually remove, just increment the counter
    this.add(value);
  }

  getValue(value: T): number {
    return this.state.get(value) || 0;
  }

  isInSet(value: T): boolean {
    const count = this.getValue(value);
    return count > 0 && count % 2 === 1;
  }

  values(): T[] {
    return Array.from(this.state.entries())
      .filter(([_, count]) => count % 2 === 1)
      .map(([value, _]) => value);
  }

  merge(other: AddWinsSet<T>): void {
    for (const [value, count] of other.state) {
      this.state.set(value, Math.max(this.getValue(value), count));
    }
  }
}