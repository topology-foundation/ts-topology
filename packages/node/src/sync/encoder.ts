import { Symbol, HashedSymbol } from "./symbol.js"
import { RandomMapping } from "./mapping.js";


class SymbolMapping {
	sourceIdx: number;
	codedIdx: number;

	constructor(sourceIdx: number, codedIdx: number) {
		this.sourceIdx = sourceIdx;
		this.codedIdx = codedIdx;
	}
}

class MappingHeap {
	// Binary heap implementation
	private heap: SymbolMapping[] = [];

	private fixHead(): void {
		let curr = 0;
		while (true) {
			let child = (curr << 1) + 1;
			if (child >= this.heap.length) {
				break;
			}
			if (
				child + 1 < this.heap.length &&
				this.heap[child + 1].codedIdx < this.heap[child].codedIdx
			) {
				child = child + 1;
			}
			if (this.heap[curr].codedIdx <= this.heap[child].codedIdx) {
				break;
			}
			[this.heap[curr], this.heap[child]] = [this.heap[child], this.heap[curr]];
			curr = child;
		}
	}

	private fixTail(): void {
		let curr = this.heap.length - 1;
		while (curr > 0) {
			const parent = (curr - 1) >> 1;
			if (this.heap[parent].codedIdx <= this.heap[curr].codedIdx) {
				break;
			}
			[this.heap[parent], this.heap[curr]] = [
				this.heap[curr],
				this.heap[parent],
			];
			curr = parent;
		}
	}

	push(mapping: SymbolMapping): void {
		this.heap.push(mapping);
		this.fixTail();
	}

	pop(): SymbolMapping | undefined {
		if (this.heap.length === 0) return undefined;
		const root = this.heap[0];
		this.heap[0] = this.heap[this.heap.length - 1];
		this.heap.pop();
		this.fixHead();
		return root;
	}
}

class CodingWindow<T extends Symbol<T>> {
	private symbols: HashedSymbol<T>[];
	private mappings: RandomMapping[];
	private queue: MappingHeap;
	private nextIdx: number;

	constructor() {
		this.symbols = [];
		this.mappings = [];
		this.queue = new MappingHeap();
		this.nextIdx = 0;
	}

	addSymbol(symbol: T): void {
		const hashedSymbol = new HashedSymbol(symbol, symbol.hash());
		this.addHashedSymbol(hashedSymbol);
	}

	addHashedSymbol(hashedSymbol: HashedSymbol<T>): void {
		const mapping = new RandomMapping(hashedSymbol.hash, 0);
		this.addHashedSymbolWithMapping(hashedSymbol, mapping);
	}

	addHashedSymbolWithMapping(
		hashedSymbol: HashedSymbol<T>,
		mapping: RandomMapping,
	): void {
		this.symbols.push(hashedSymbol);
		this.mappings.push(mapping);
		this.queue.push(
			new SymbolMapping(this.symbols.length - 1, mapping.lastIdx),
		);
	}

	applyWindow(cw: CodedSymbol<T>, direction: number): CodedSymbol<T> {
		if (this.queue.size === 0) {
			this.nextIdx += 1;
			return cw;
		}

		while (this.queue.top?.codedIdx === this.nextIdx) {
			const mapping = this.queue.pop();
			if (mapping) {
				cw = cw.apply(this.symbols[mapping.sourceIdx], direction);
				const nextMap = this.mappings[mapping.sourceIdx].nextIndex();
				mapping.codedIdx = nextMap;
				this.queue.push(mapping);
			}
		}
		this.nextIdx += 1;
		return cw;
	}

	reset(): void {
		this.symbols = [];
		this.mappings = [];
		this.queue = new MappingHeap();
		this.nextIdx = 0;
	}
}

class Encoder<T extends Symbol<T>> extends CodingWindow<T> {
	addSymbol(s: T): void {
		super.addSymbol(s);
	}

	addHashedSymbol(s: HashedSymbol<T>): void {
		super.addHashedSymbol(s);
	}

	produceNextCodedSymbol(): CodedSymbol<T> {
		return super.applyWindow(new CodedSymbol<T>(), 1);
	}

	reset(): void {
		super.reset();
	}
}
