export class BitSet {
	private data: Uint32Array;

	constructor(size: number) {
		if ((size >> 5) << 5 !== size) {
			this.data = new Uint32Array((size >> 5) + 1);
		} else {
			this.data = new Uint32Array(size >> 5);
		}
	}

	set(index: number): void {
		const byteIndex = index >> 5;
		const bitIndex = index & 31;
		this.data[byteIndex] |= 1 << bitIndex;
	}

	clear(): void {
		this.data = new Uint32Array(this.data.length);
	}

	get(index: number): boolean {
		const byteIndex = index >> 5;
		const bitIndex = index & 31;
		return (this.data[byteIndex] & (1 << bitIndex)) !== 0;
	}

	flip(index: number): void {
		const byteIndex = index >> 5;
		const bitIndex = index & 31;
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

	_or(other: BitSet): void {
		for (let i = 0; i < this.data.length; i++) {
			this.data[i] |= other.data[i];
		}
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
		let newData: Uint32Array;
		if ((size >> 5) << 5 !== size) {
			newData = new Uint32Array((size >> 5) + 1);
		} else {
			newData = new Uint32Array(size >> 5);
		}
		const length = Math.min(this.data.length, newData.length);
		for (let i = 0; i < length; i++) {
			newData[i] = this.data[i];
		}
		this.data = newData;
	}

	size(): number {
		return this.data.length << 5;
	}

	toString(): string {
		return Array.from(this.data)
			.reverse()
			.map((int) => int.toString(2).padStart(32, "0"))
			.join("");
	}
}
