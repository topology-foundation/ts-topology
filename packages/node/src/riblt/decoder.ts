import { CodingPrefix } from "./encoder.js";
import type { CodedSymbol, HashedSymbol, SourceSymbol } from "./symbol.js";

export class Decoder extends CodingPrefix {
	decodedLocalSymbols: SourceSymbol[] = [];
	decodedRemoteSymbols: SourceSymbol[] = [];
	isDecoded: boolean[] = [];
	modifiedCodedSymbols: number[] = [];
	visited: boolean[] = [];
	remaining = 0;
	pureSymbols: CodedSymbol[] = [];

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
		localSymbol: CodedSymbol,
		remoteSymbol: CodedSymbol,
	): void {
		this.extendPrefix(index + 1);
		this.codedSymbols[index].apply(localSymbol, localSymbol.count);
		this.codedSymbols[index].apply(remoteSymbol, -remoteSymbol.count);
		if (!this.visited[index]) {
			this.visited[index] = true;
			this.modifiedCodedSymbols.push(index);
		}
	}

	maps(index: number, hashedSymbol: HashedSymbol, direction: number): void {
		if (!this.isDecoded[index]) {
			this.codedSymbols[index].apply(hashedSymbol, direction);
			if (!this.visited[index]) {
				this.visited[index] = true;
				this.modifiedCodedSymbols.push(index);
			}
		}
	}

	tryDecode(): boolean {
		this.computePrefix(this.codedSymbols.length);
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
					const decodedSymbol = symbol.sum;
					if (symbol.count === 1) {
						this.decodedLocalSymbols.push(decodedSymbol);
					} else if (symbol.count === -1) {
						this.decodedRemoteSymbols.push(decodedSymbol);
					} else {
						throw Error(`Invalid pure symbol ${symbol}`);
					}
					this.isDecoded[index] = true;
					this.remaining--;
					this.addSymbol(decodedSymbol, -symbol.count);
					this.computePrefix(this.codedSymbols.length);
				}
			}
		}
		return this.remaining === 0;
	}
}
