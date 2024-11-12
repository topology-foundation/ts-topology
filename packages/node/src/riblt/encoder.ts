import { type SourceSymbol, type SourceSymbolFactory, CodedSymbol, HashedSymbol } from "./symbol.js"
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

	pop(): SymbolMapping {
		if (this.heap.length === 0) throw Error("Heap is empty");
		const root = this.heap[0];
		this.heap[0] = this.heap[this.heap.length - 1];
		this.heap.pop();
		this.fixHead();
		return root;
	}

	get top(): SymbolMapping {
		if (this.heap.length === 0) throw Error("Heap is empty");
		return this.heap[0];
	}

	get size(): number {
		return this.heap.length;
	}
}

export class CodingPrefix<T extends SourceSymbol> {
	private sourceSymbols: HashedSymbol<T>[];
	private sourceSymbolDirections: number[];
	public codedSymbols: CodedSymbol<T>[];
	private mapGenerators: RandomMapping[];
	private queue: MappingHeap;

	constructor(protected readonly sourceSymbolFactory: SourceSymbolFactory<T>) {
		this.sourceSymbols = [];
		this.sourceSymbolDirections = [];
		this.codedSymbols = [new CodedSymbol<T>(sourceSymbolFactory.empty(), sourceSymbolFactory.emptyHash(), 0)];
		this.mapGenerators = [];
		this.queue = new MappingHeap();
	}

	addSymbol(symbol: T): void {
		const hashedSymbol = new HashedSymbol<T>(this.sourceSymbolFactory.clone(symbol), symbol.hash());
		this.addHashedSymbol(hashedSymbol);
	}

	protected addHashedSymbol(hashedSymbol: HashedSymbol<T>, direction = 1): void {
		const mapping = new RandomMapping(hashedSymbol.checksum, 0);
		this.addHashedSymbolWithMapping(hashedSymbol, mapping, direction);
	}

	protected addHashedSymbolWithMapping(
		hashedSymbol: HashedSymbol<T>,
		mapping: RandomMapping,
		direction = 1,
	): void {
		this.sourceSymbols.push(hashedSymbol);
		this.sourceSymbolDirections.push(direction);
		this.mapGenerators.push(mapping);
		this.queue.push(new SymbolMapping(this.sourceSymbols.length - 1, mapping.lastIdx));
	}

	extendPrefix(size: number): void {
		while (this.codedSymbols.length < size) {
			this.codedSymbols.push(new CodedSymbol<T>(this.sourceSymbolFactory.empty(), this.sourceSymbolFactory.emptyHash(), 0));
		}
		while (this.queue.size > 0 && this.queue.top.codedIdx < size) {
			const mapping = this.queue.pop();
			while (mapping.codedIdx < size) {
				const sourceIdx = mapping.sourceIdx;
				const codedIdx = mapping.codedIdx;
				this.codedSymbols[codedIdx].apply(this.sourceSymbols[sourceIdx], this.sourceSymbolDirections[sourceIdx]);
				mapping.codedIdx = this.mapGenerators[sourceIdx].nextIndex();
			}
			this.queue.push(mapping);
		}
	}
}

export class Encoder<T extends SourceSymbol> extends CodingPrefix<T> {
	producePrefix(size: number): CodedSymbol<T>[] {
		super.extendPrefix(size);
		return this.codedSymbols.slice(0, size);
	}
}
