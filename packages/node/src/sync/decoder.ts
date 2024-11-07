import type { Symbol } from "./symbol.js";
import type { CodedSymbol, HashedSymbol } from "./symbol.js";

export class Decoder<T extends Symbol<T>> {
	private cs: CodedSymbol<T>[] = [];
	private local: CodingWindow<T>;
	private window: CodingWindow<T>;
	private remote: CodingWindow<T>;
	private decodable: number[] = [];
	private decoded: number = 0;

	constructor() {
		this.local = new CodingWindow<T>();
		this.window = new CodingWindow<T>();
		this.remote = new CodingWindow<T>();
	}

	public decoded(): boolean {
		return this.decoded === this.cs.length;
	}

	public localSymbols(): HashedSymbol<T>[] {
		return this.local.symbols;
	}

	public remoteSymbols(): HashedSymbol<T>[] {
		return this.remote.symbols;
	}

	public addSymbol(s: T): void {
		const th = new HashedSymbol<T>(s, s.hash());
		this.addHashedSymbol(th);
	}

	public addHashedSymbol(s: HashedSymbol<T>): void {
		this.window.addHashedSymbol(s);
	}

	public addCodedSymbol(c: CodedSymbol<T>): void {
		c = this.window.applyWindow(c, "remove");
		c = this.remote.applyWindow(c, "remove");
		c = this.local.applyWindow(c, "add");
		this.cs.push(c);
		if ((c.count === 1 || c.count === -1) && c.hash === c.symbol.hash()) {
			this.decodable.push(this.cs.length - 1);
		} else if (c.count === 0 && c.hash === 0) {
			this.decodable.push(this.cs.length - 1);
		}
	}

	private applyNewSymbol(t: HashedSymbol<T>, direction: number): RandomMapping {
		const m = new RandomMapping(t.hash, 0);
		while (m.lastIdx < this.cs.length) {
			const cidx = m.lastIdx;
			this.cs[cidx] = this.cs[cidx].apply(t, direction);
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

	public tryDecode(): void {
		for (const didx of this.decodable) {
			const cidx = this.decodable[didx];
			const c = this.cs[cidx];
			switch (c.count) {
				case 1:
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

	public reset(): void {
		this.cs = [];
		this.decodable = [];
		this.local.reset();
		this.remote.reset();
		this.window.reset();
		this.decoded = 0;
	}
}
