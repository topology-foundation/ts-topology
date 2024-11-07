import { Symbol } from "./symbol.js";
import { HashedSymbol, CodedSymbol } from "./symbol.js";
import { RandomMapping } from "./mapping.js";
import { Decoder } from "./decoder.js";

export class Sketch<T extends Symbol<T>> {
	s: CodedSymbol<T>[] = [];

	addHashedSymbol(t: HashedSymbol<T>) {
		const m = new RandomMapping(t.Hash, 0);
		while (m.lastIdx < this.s.length) {
			const idx = m.lastIdx;
			this.s[idx].Symbol = this.s[idx].Symbol.XOR(t.Symbol);
			this.s[idx].Count += 1;
			this.s[idx].Hash ^= t.Hash;
			m.nextIndex();
		}
	}

	removeHashedSymbol(t: HashedSymbol<T>) {
		const m = new RandomMapping(t.Hash, 0);
		while (m.lastIdx < this.s.length) {
			const idx = m.lastIdx;
			this.s[idx].Symbol = this.s[idx].Symbol.XOR(t.Symbol);
			this.s[idx].Count -= 1;
			this.s[idx].Hash ^= t.Hash;
			m.nextIndex();
		}
	}

	addSymbol(t: T) {
		const hs = new HashedSymbol(t, t.Hash());
		this.addHashedSymbol(hs);
	}

	removeSymbol(t: T) {
		const hs = new HashedSymbol(t, t.Hash());
		this.removeHashedSymbol(hs);
	}

	subtract(s2: Sketch<T>) {
		if (this.s.length !== s2.s.length) {
			throw Error("subtracting sketches of different sizes");
		}

		for (let i = 0; i < this.s.length; i++) {
			this.s[i].Symbol = this.s[i].Symbol.XOR(s2.s[i].Symbol);
			this.s[i].Count -= s2.s[i].Count;
			this.s[i].Hash ^= s2.s[i].Hash;
		}
	}

	decode(): { fwd: HashedSymbol<T>[]; rev: HashedSymbol<T>[]; succ: boolean } {
		const dec = new Decoder<T>();
		for (const c of this.s) {
			dec.addCodedSymbol(c);
		}
		dec.tryDecode();
		return {
			fwd: dec.remote(),
			rev: dec.local(),
			succ: dec.decoded(),
		};
	}
}
