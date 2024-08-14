/// GSet with support for state and op changes
export class AddWinsSet<T extends number> {
    private _addSet: Set<T>;
    private _removeSet: Set<T>;
  
    constructor(addSet: Set<T>, removeSet: Set<T>) {
      this._addSet = addSet;
      this._removeSet = removeSet;
    }
  
    add(element: T): void {
      this._addSet.add(element);
    }
  
    remove(element: T): void {
      this._removeSet.add(element);
    }

    read(): T {
      const addResult = Array.from(this._addSet).reduce((acc, val) => acc + val, 0);
      const removeResult = Array.from(this._addSet).reduce((acc, val) => acc + val, 0);
      return (addResult - removeResult) as T;
    }
  }