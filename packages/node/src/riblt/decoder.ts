import type { SourceSymbol, CodedSymbol, SourceSymbolFactory } from "./symbol.js";
import { RandomMapping } from "./mapping.js";


export class Decoder<T extends SourceSymbol> {
	decodedSymbols: T[];

	constructor(private readonly sourceSymbolFactory: SourceSymbolFactory<T>) {
		this.decodedSymbols = [];
	}

	tryDecode(local: CodedSymbol<T>[], remote: CodedSymbol<T>[]): boolean {
		if (local.length !== remote.length) {
			throw Error("The length of coded symbol sequences must be equal");
		}

		for (let i = 0; i < local.length; i++) {
			local[i].xor(remote[i]);
		}

		this.decodedSymbols = [];
		const pureSymbols: CodedSymbol<T>[] = [];
		let remaining = 0;
		const isDecoded = new Array(local.length).fill(false);

		for (let i = 0; i < local.length; i++) {
			if (local[i].isZero()) {
				isDecoded[i] = true;
			} else {
				remaining++;
				if (local[i].isPure()) {
					pureSymbols.push(local[i]);
				}
			}
		}

		while (pureSymbols.length > 0) {
			const symbol = pureSymbols.pop() as CodedSymbol<T>;
			if (symbol.isZero()) {
				continue;
			}
			this.decodedSymbols.push(this.sourceSymbolFactory.clone(symbol.sum));

			const mapping = new RandomMapping(symbol.checksum, 0);
			while (mapping.lastIdx < local.length) {
				const idx = mapping.lastIdx;
				if (isDecoded[idx]) {
					continue;
				}
				local[idx].xor(symbol);
				if (local[idx].isZero()) {
					isDecoded[idx] = true;
					remaining--;
				} else if (local[idx].isPure()) {
					pureSymbols.push(local[idx]);
				}
			}
		}

		return remaining === 0;
	}
}
