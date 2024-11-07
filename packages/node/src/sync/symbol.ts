export interface Symbol<T> {
    XOR(t2: T): T;
    Hash(): number;
}

export class HashedSymbol<T extends Symbol<T>> {
    Symbol: T;
    Hash: number;
  
    constructor(symbol: T, hash: number) {
      this.Symbol = symbol;
      this.Hash = hash;
    }
}

export class CodedSymbol<T extends Symbol<T>> extends HashedSymbol<T> {
    Count: number;
  
    constructor(symbol: T, hash: number, count = 0) {
      super(symbol, hash);
      this.Count = count;
    }
  
    static readonly ADD = 1;
    static readonly REMOVE = -1;

    apply(s: HashedSymbol<T>, direction: number): CodedSymbol<T> {
      this.Symbol = this.Symbol.XOR(s.Symbol);
      this.Hash ^= s.Hash;
      this.Count += direction;
      return this;
    }
}
