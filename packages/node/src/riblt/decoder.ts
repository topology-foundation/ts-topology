import { type SourceSymbol, type CodedSymbol, type SourceSymbolFactory, HashedSymbol } from "./symbol.js";
import { RandomMapping } from "./mapping.js";
import { CodingPrefix } from "./encoder.js";


export class Decoder<T extends SourceSymbol> extends CodingPrefix<T> {
	decodedSymbols: T[];
	isDecoded: boolean[];
	remaining: number;
	pureSymbols: CodedSymbol<T>[];

	constructor(sourceSymbolFactory: SourceSymbolFactory<T>) {
		super(sourceSymbolFactory);
		this.decodedSymbols = [];
		this.isDecoded = [];
		this.remaining = 0;
		this.pureSymbols = [];
	}

	extendPrefix(size: number): void {
		super.extendPrefix(size);
		while (this.isDecoded.length < size) {
			this.isDecoded.push(false);
		}
	}

	// called at most once for each index
	applyCodedSymbol(index: number, localSymbol: CodedSymbol<T>, remoteSymbol: CodedSymbol<T>): void {
		this.extendPrefix(index + 1);
		this.codedSymbols[index].apply(localSymbol, localSymbol.count);
		this.codedSymbols[index].apply(remoteSymbol, -remoteSymbol.count);
		if (this.codedSymbols[index].isZero()) {
			this.isDecoded[index] = true;
		} else {
			this.remaining++;
			if (this.codedSymbols[index].isPure()) {
				this.pureSymbols.push(this.codedSymbols[index]);
			}
		}
	}

	tryDecode(): boolean {
		while (this.pureSymbols.length > 0) {
			const symbol = this.pureSymbols.pop() as CodedSymbol<T>;
			// console.log(`pure symbol: ${symbol.sum.data} ${symbol.count}`);
			if (symbol.isZero()) {
				continue;
			}
			const decodedSymbol = this.sourceSymbolFactory.clone(symbol.sum)
			this.decodedSymbols.push(decodedSymbol);

			const mapping = new RandomMapping(symbol.checksum, 0);
			while (mapping.lastIdx < this.codedSymbols.length) {
				const idx = mapping.lastIdx;
				if (!this.isDecoded[idx]) {
					this.codedSymbols[idx].xor(symbol);
					if (this.codedSymbols[idx].isZero()) {
						this.isDecoded[idx] = true;
						this.remaining--;
					} else if (this.codedSymbols[idx].isPure()) {
						this.pureSymbols.push(this.codedSymbols[idx]);
					}
				}
				mapping.nextIndex();
			}
			this.addHashedSymbolWithMapping(new HashedSymbol<T>(decodedSymbol), mapping, -symbol.count);
		}

		return this.remaining === 0;
	}
}
