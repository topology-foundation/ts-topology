export interface SourceSymbol {
	xor(s: SourceSymbol): void;
	hash(): Uint8Array;
	toString(): string;
}

export class HashedSymbol<T extends SourceSymbol> {
	sum: T;
	checksum: Uint8Array;

	constructor(sum: T, checksum?: Uint8Array) {
		this.sum = sum;
		if (checksum === undefined) {
			this.checksum = sum.hash();
		} else {
			this.checksum = checksum;
		}
	}

	xor(s: HashedSymbol<T>): void {
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

export class CodedSymbol<T extends SourceSymbol> extends HashedSymbol<T> {
	count: number;

	constructor(sum: T, checksum: Uint8Array, count: number) {
		super(sum, checksum);
		this.count = count;
	}

	apply(s: HashedSymbol<T>, direction: number) {
		super.xor(s);
		this.count += direction;
	}

	xor(s: CodedSymbol<T>) {
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

export abstract class SymbolFactory<T extends SourceSymbol> {
	abstract emptySource(): T;
	abstract emptyHash(): Uint8Array;
	emptyCoded(): CodedSymbol<T> {
		return new CodedSymbol(this.emptySource(), this.emptyHash(), 0);
	}
}
