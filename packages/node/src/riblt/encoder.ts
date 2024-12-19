import { RandomMapping } from "./mapping.js";
import { type CodedSymbol, HashedSymbol, type SourceSymbol } from "./symbol.js";

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

	set top(mapping: SymbolMapping) {
		if (this.heap.length === 0) throw Error("Heap is empty");
		this.heap[0] = mapping;
		this.fixHead();
	}

	get top(): SymbolMapping {
		if (this.heap.length === 0) throw Error("Heap is empty");
		return this.heap[0];
	}

	get size(): number {
		return this.heap.length;
	}
}

export class CodingPrefix {
	private sourceSymbols: HashedSymbol[];
	private sourceSymbolDirections: number[];
	public codedSymbols: CodedSymbol[];
	private mapGenerators: RandomMapping[];
	private queue: MappingHeap;

	constructor(private readonly newCodedSymbol: () => CodedSymbol) {
		this.sourceSymbols = [];
		this.sourceSymbolDirections = [];
		this.codedSymbols = [newCodedSymbol()];
		this.mapGenerators = [];
		this.queue = new MappingHeap();
	}

	addSymbol(symbol: SourceSymbol, direction = 1): void {
		const hashedSymbol = new HashedSymbol(symbol);
		const mapping = new RandomMapping(hashedSymbol.checksum, 0);

		this.sourceSymbols.push(hashedSymbol);
		this.sourceSymbolDirections.push(direction);
		this.mapGenerators.push(mapping);
		this.queue.push(
			new SymbolMapping(this.sourceSymbols.length - 1, mapping.lastIdx),
		);
	}

	maps(index: number, hashedSymbol: HashedSymbol, direction: number): void {
		this.codedSymbols[index].apply(hashedSymbol, direction);
	}

	extendPrefix(size: number): void {
		while (this.codedSymbols.length < size) {
			this.codedSymbols.push(this.newCodedSymbol());
		}
	}

	computePrefix(size: number): void {
		while (this.queue.size > 0 && this.queue.top.codedIdx < size) {
			const mapping = this.queue.top;
			while (mapping.codedIdx < size) {
				const sourceIdx = mapping.sourceIdx;
				const codedIdx = mapping.codedIdx;
				this.maps(
					codedIdx,
					this.sourceSymbols[sourceIdx],
					this.sourceSymbolDirections[sourceIdx],
				);
				mapping.codedIdx = this.mapGenerators[sourceIdx].nextIndex();
			}
			this.queue.top = mapping;
		}
	}
}

export class Encoder extends CodingPrefix {
	producePrefix(size: number): void {
		super.extendPrefix(size);
		super.computePrefix(size);
	}
}
