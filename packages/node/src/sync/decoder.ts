import type { Symbol } from "./symbol.js";
import type { CodedSymbol, HashedSymbol } from "./symbol.js";

export class Decoder<T extends Symbol<T>> {
	// Coded symbols received so far
	private cs: CodedSymbol<T>[] = [];
	// Set of source symbols that are exclusive to the decoder
	private local: CodingWindow<T>;
	// Set of source symbols that the decoder initially has
	private window: CodingWindow<T>;
	// Set of source symbols that are exclusive to the encoder
	private remote: CodingWindow<T>;
	// Indices of coded symbols that can be decoded, i.e., degree equal to -1
	// or 1 and sum of hash equal to hash of sum, or degree equal to 0 and sum
	// of hash equal to 0
	private decodable: number[] = [];
	// Number of coded symbols that are decoded
	private decoded: number = 0;

	constructor() {
		this.local = new CodingWindow<T>();
		this.window = new CodingWindow<T>();
		this.remote = new CodingWindow<T>();
	}

	// Decoded returns true if and only if every existing coded symbols d received
	// so far have been decoded.
	public decoded(): boolean {
		return this.decoded === this.cs.length;
	}

	// Local returns the list of source symbols that are present in B but not in A.
	public localSymbols(): HashedSymbol<T>[] {
		return this.local.symbols;
	}

	// Remote returns the list of source symbols that are present in A but not in B.
	public remoteSymbols(): HashedSymbol<T>[] {
		return this.remote.symbols;
	}

	// AddSymbol adds a source symbol to B, the Decoder's local set.
	public addSymbol(s: T): void {
		const th = new HashedSymbol<T>(s, s.hash());
		this.addHashedSymbol(th);
	}

	// AddHashedSymbol adds a source symbol to B, the Decoder's local set.
	public addHashedSymbol(s: HashedSymbol<T>): void {
		this.window.addHashedSymbol(s);
	}

	// AddCodedSymbol passes the next coded symbol in A's sequence to the Decoder.
	public addCodedSymbol(c: CodedSymbol<T>): void {
		// Scan through decoded symbols to peel off matching ones
		c = this.window.applyWindow(c, "remove");
		c = this.remote.applyWindow(c, "remove");
		c = this.local.applyWindow(c, "add");
		// Insert the new coded symbol
		this.cs.push(c);
		// Check if the coded symbol is decodable, and insert into decodable list if so
		if ((c.count === 1 || c.count === -1) && c.hash === c.symbol.hash()) {
			this.decodable.push(this.cs.length - 1);
		} else if (c.count === 0 && c.hash === 0) {
			this.decodable.push(this.cs.length - 1);
		}
	}

	// Apply a new symbol and modify the corresponding coded symbols
	private applyNewSymbol(t: HashedSymbol<T>, direction: number): RandomMapping {
		const m = new RandomMapping(t.hash, 0);
		while (m.lastIdx < this.cs.length) {
			const cidx = m.lastIdx;
			this.cs[cidx] = this.cs[cidx].apply(t, direction);
			// Check if the coded symbol is now decodable
			if (
				(this.cs[cidx].count === -1 || this.cs[cidx].count === 1) &&
				this.cs[cidx].hash === this.cs[cidx].symbol.hash()
			) {
				this.decodable.push(cidx);
			}
			m.nextIndex();
		}
		return m;
	}

	// TryDecode tries to decode all coded symbols received so far.
	public tryDecode(): void {
		for (const didx of this.decodable) {
			const cidx = this.decodable[didx];
			const c = this.cs[cidx];
			switch (c.count) {
				case 1:
					// Allocate a symbol and then XOR with the sum
					const ns1 = new HashedSymbol<T>();
					ns1.symbol = ns1.symbol.xor(c.symbol);
					ns1.hash = c.hash;
					const m1 = this.applyNewSymbol(ns1, -1);
					this.remote.addHashedSymbolWithMapping(ns1, m1);
					this.decoded += 1;
					break;
				case -1:
					const ns2 = new HashedSymbol<T>();
					ns2.symbol = ns2.symbol.xor(c.symbol);
					ns2.hash = c.hash;
					const m2 = this.applyNewSymbol(ns2, 1);
					this.local.addHashedSymbolWithMapping(ns2, m2);
					this.decoded += 1;
					break;
				case 0:
					this.decoded += 1;
					break;
				default:
					throw new Error("Invalid degree for decodable coded symbol");
			}
		}
		this.decodable = [];
	}

	// Reset clears the decoder.
	public reset(): void {
		this.cs = [];
		this.decodable = [];
		this.local.reset();
		this.remote.reset();
		this.window.reset();
		this.decoded = 0;
	}
}
