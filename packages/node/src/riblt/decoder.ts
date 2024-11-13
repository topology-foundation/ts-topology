import { CodingPrefix } from "./encoder.js";
import type {
	CodedSymbol,
	HashedSymbol,
	SourceSymbol,
	SymbolFactory,
} from "./symbol.js";

export class Decoder<T extends SourceSymbol> extends CodingPrefix<T> {
	decodedLocalSymbols: T[];
	decodedRemoteSymbols: T[];
	isDecoded: boolean[];
	modifiedCodedSymbols: number[];
	visited: boolean[];
	remaining: number;
	pureSymbols: CodedSymbol<T>[];

	constructor(sourceSymbolFactory: SymbolFactory<T>) {
		super(sourceSymbolFactory);
		this.decodedLocalSymbols = [];
		this.decodedRemoteSymbols = [];
		this.isDecoded = [];
		this.modifiedCodedSymbols = [];
		this.visited = [];
		this.remaining = 0;
		this.pureSymbols = [];
	}

	extendPrefix(size: number): void {
		super.extendPrefix(size);
		while (this.isDecoded.length < size) {
			this.isDecoded.push(false);
			this.visited.push(false);
			this.remaining++;
		}
	}

	// called at most once for each index
	addCodedSymbol(
		index: number,
		localSymbol: CodedSymbol<T>,
		remoteSymbol: CodedSymbol<T>,
	): void {
		this.extendPrefix(index + 1);
		this.codedSymbols[index].apply(localSymbol, localSymbol.count);
		this.codedSymbols[index].apply(remoteSymbol, -remoteSymbol.count);
		this.computePrefix(index + 1);
		this.modifiedCodedSymbols.push(index);
	}

	maps(index: number, hashedSymbol: HashedSymbol<T>, direction: number): void {
		if (!this.isDecoded[index]) {
			// console.log(`+ map ${hashedSymbol}, dir=${direction} to index ${index}`)
			this.codedSymbols[index].apply(hashedSymbol, direction);
			if (!this.visited[index]) {
				this.visited[index] = true;
				this.modifiedCodedSymbols.push(index);
			}
		}
	}

	tryDecode(): boolean {
		while (this.modifiedCodedSymbols.length > 0) {
			const candidates: number[] = [];
			for (const index of this.modifiedCodedSymbols) {
				if (this.isDecoded[index]) {
					continue;
				}
				this.visited[index] = true;
				const symbol = this.codedSymbols[index];
				if (symbol.isZero()) {
					// The set difference is empty. We can safely mark this index as decoded.
					this.isDecoded[index] = true;
					this.remaining--;
				} else if (symbol.isPure()) {
					// Found a (potentially) pure symbol.
					candidates.push(index);
				}
			}
			// Arrays cleanup
			for (const index of this.modifiedCodedSymbols) {
				this.visited[index] = false;
			}
			this.modifiedCodedSymbols = [];

			// Process pure symbols
			for (const index of candidates) {
				if (this.isDecoded[index]) {
					continue;
				}
				const symbol = this.codedSymbols[index];
				if (symbol.isZero()) {
					this.isDecoded[index] = true;
					this.remaining--;
				} else if (symbol.isPure()) {
					const decodedSymbol = this.symbolFactory.cloneSource(symbol.sum);
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
			}
		}
		return this.remaining === 0;
	}
}
