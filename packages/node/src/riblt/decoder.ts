import { type SourceSymbol, type CodedSymbol, type SourceSymbolFactory, HashedSymbol } from "./symbol.js";
import { RandomMapping } from "./mapping.js";
import { CodingPrefix } from "./encoder.js";


export class Decoder<T extends SourceSymbol> extends CodingPrefix<T> {
	decodedLocalSymbols: T[];
	decodedRemoteSymbols: T[];
	isDecoded: boolean[];
	remaining: number;
	pureSymbols: CodedSymbol<T>[];

	constructor(sourceSymbolFactory: SourceSymbolFactory<T>) {
		super(sourceSymbolFactory);
		this.decodedLocalSymbols = [];
		this.decodedRemoteSymbols = [];
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
	addCodedSymbol(index: number, localSymbol: CodedSymbol<T>, remoteSymbol: CodedSymbol<T>): void {
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

	maps(index: number, hashedSymbol: HashedSymbol<T>, direction: number): void {
		if (!this.isDecoded[index]) {
			this.codedSymbols[index].apply(hashedSymbol, direction);
			if (this.codedSymbols[index].isZero()) {
				this.isDecoded[index] = true;
				this.remaining--;
			} else if (this.codedSymbols[index].isPure()) {
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
			if (symbol.count === 1) {
				this.decodedLocalSymbols.push(decodedSymbol);
			} else if (symbol.count === -1) {
				this.decodedRemoteSymbols.push(decodedSymbol);
			} else {
				throw Error(`Invalid pure symbol ${symbol.sum.data} ${symbol.count}`);
			}

			const mapping = new RandomMapping(symbol.checksum, 0);
			this.addSymbol(decodedSymbol, -symbol.count);
			this.extendPrefix(this.codedSymbols.length);	// trigger updates
			// console.log('abc')
		}
		return this.remaining === 0;
	}
}
