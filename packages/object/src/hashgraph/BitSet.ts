/* 
	BitSet is associated with each vertex and is used to store the indices of the vertices that are reachable.
	In other words, all the vertices causally before in the hashgraph.
	When processing in the topologically ordered manner, we set the BitSet of the vertex to the bitwise OR of the BitSet of its dependencies.
	Then, to check if two vertices are causally related, we check if the BitSet of the first vertex contains the index of the second vertex and vice-versa.
	Algorithm for more optimal causality check inspired by https://stackoverflow.com/a/78133041
*/
export class BitSet {
	private data: Uint32Array;

	// (index / 32) | 0 is equivalent to Math.floor(index / 32)

	constructor(size: number) {
		this.data = new Uint32Array(Math.ceil(size / 32));
	}

	set(index: number): void {
		const byteIndex = ~~(index / 32);
		const bitIndex = index % 32;
		this.data[byteIndex] |= 1 << bitIndex;
	}

	clear(): void {
		this.data = new Uint32Array(this.data.length);
	}

	get(index: number): boolean {
		const byteIndex = (index / 32) | 0;
		const bitIndex = index % 32;
		return (this.data[byteIndex] & (1 << bitIndex)) !== 0;
	}

	flip(index: number): void {
		const byteIndex = (index / 32) | 0;
		const bitIndex = index % 32;
		this.data[byteIndex] ^= 1 << bitIndex;
	}

	// AND two bitsets of the same size
	and(other: BitSet): BitSet {
		const result = new BitSet(this.size());
		for (let i = 0; i < this.data.length; i++) {
			result.data[i] = this.data[i] & other.data[i];
		}
		return result;
	}

	// OR two bitsets of the same size
	or(other: BitSet): BitSet {
		const result = new BitSet(this.size());
		for (let i = 0; i < this.data.length; i++) {
			result.data[i] = this.data[i] | other.data[i];
		}
		return result;
	}

	// XOR two bitsets of the same size
	xor(other: BitSet): BitSet {
		const result = new BitSet(this.size());
		for (let i = 0; i < this.data.length; i++) {
			result.data[i] = this.data[i] ^ other.data[i];
		}
		return result;
	}

	not(): BitSet {
		const result = new BitSet(this.size());
		for (let i = 0; i < this.data.length; i++) {
			result.data[i] = ~this.data[i];
		}
		return result;
	}

	resize(size: number): void {
		const newData: Uint32Array = new Uint32Array(Math.ceil(size / 32));
		const length = Math.min(this.data.length, newData.length);
		for (let i = 0; i < length; i++) {
			newData[i] = this.data[i];
		}
		this.data = newData;
	}

	size(): number {
		return this.data.length * 32;
	}

	toString(): string {
		return Array.from(this.data)
			.reverse()
			.map((int) => int.toString(2).padStart(32, "0"))
			.join("");
	}
}
