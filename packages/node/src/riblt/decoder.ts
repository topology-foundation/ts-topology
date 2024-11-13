import type { SourceSymbol, CodedSymbol, SymbolFactory, HashedSymbol } from "./symbol.js";
import { CodingPrefix } from "./encoder.js";


export class Decoder<T extends SourceSymbol> extends CodingPrefix<T> {
	decodedLocalSymbols: T[];
	decodedRemoteSymbols: T[];
	isDecoded: boolean[];
	remaining: number;
	pureSymbols: CodedSymbol<T>[];

	constructor(sourceSymbolFactory: SymbolFactory<T>) {
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
		this.computePrefix(index + 1);
		if (this.codedSymbols[index].isZero()) {
			this.isDecoded[index] = true;
		} else {
			this.remaining++;
			if (this.codedSymbols[index].isPure()) {
				console.log(`- addCodedSymbol[${index}]: ${this.codedSymbols[index]}`);
				this.pureSymbols.push(this.symbolFactory.cloneCoded(this.codedSymbols[index]));
			}
		}
	}

	maps(index: number, hashedSymbol: HashedSymbol<T>, direction: number): void {
		if (!this.isDecoded[index]) {
			console.log(`+ map ${hashedSymbol}, dir=${direction} to index ${index}`)
			this.codedSymbols[index].apply(hashedSymbol, direction);
			if (this.codedSymbols[index].isZero()) {
				this.isDecoded[index] = true;
				this.remaining--;
			} else if (this.codedSymbols[index].isPure()) {
				console.log(`- maps[${index}]: ${this.codedSymbols[index]}`);
				this.pureSymbols.push(this.symbolFactory.cloneCoded(this.codedSymbols[index]));
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
			const decodedSymbol = this.symbolFactory.cloneSource(symbol.sum)
			if (symbol.count === 1) {
				this.decodedLocalSymbols.push(decodedSymbol);
			} else if (symbol.count === -1) {
				this.decodedRemoteSymbols.push(decodedSymbol);
			} else {
				throw Error(`Invalid pure symbol ${symbol}`);
			}

			this.addSymbol(decodedSymbol, -symbol.count);
			this.computePrefix(this.codedSymbols.length);
		}
		return this.remaining === 0;
	}
}
