export interface SourceSymbol {
	xor(s: SourceSymbol): void;
	hash(): Uint8Array;
	toString(): string;
}

export class HashedSymbol {
	sum: SourceSymbol;
	checksum: Uint8Array;

	constructor(sum: SourceSymbol, checksum?: Uint8Array) {
		this.sum = sum;
		if (checksum === undefined) {
			this.checksum = sum.hash();
		} else {
			this.checksum = checksum;
		}
	}

	xor(s: HashedSymbol): void {
		this.sum.xor(s.sum);
		for (let i = 0; i < this.checksum.length; i++) {
			this.checksum[i] ^= s.checksum[i];
		}
	}

	isPure(): boolean {
		const checksum = this.sum.hash();
		if (checksum.length !== this.checksum.length) {
			throw Error("Checksum length mismatch");
		}
		for (let i = 0; i < checksum.length; i++) {
			if (checksum[i] !== this.checksum[i]) {
				return false;
			}
		}
		return true;
	}

	toString(): string {
		return `HashedSymbol(sum=${this.sum}, hash=[${this.checksum}])`;
	}
}

export class CodedSymbol extends HashedSymbol {
	count: number;

	constructor(sum: SourceSymbol, checksum: Uint8Array, count: number) {
		super(sum, checksum);
		this.count = count;
	}

	apply(s: HashedSymbol, direction: number): void {
		super.xor(s);
		this.count += direction;
	}

	xor(s: CodedSymbol): void {
		super.xor(s);
		this.count -= s.count;
	}

	isZero(): boolean {
		if (this.count !== 0) {
			return false;
		}
		for (let i = 0; i < this.checksum.length; i++) {
			if (this.checksum[i] !== 0) {
				return false;
			}
		}
		return true;
	}

	toString(): string {
		return `CodedSymbol(sum=${this.sum}, hash=[${this.checksum}], ${this.count})`;
	}
}
