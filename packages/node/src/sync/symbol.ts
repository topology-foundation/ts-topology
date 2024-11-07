import * as crypto from "node:crypto";


class HashedSymbol {
	sum: Uint8Array;
	checksum: Uint8Array;

	constructor(sum: Uint8Array, checksum?: Uint8Array) {
		this.sum = new Uint8Array(sum);
		if (checksum !== undefined) {
			this.checksum = new Uint8Array(checksum);
		} else {
			this.checksum = crypto.createHmac("sha1", "").update(sum).digest();
		}
	}

	XOR(s: HashedSymbol) {
		for (let i = 0; i < this.sum.length; i++) {
			this.sum[i] ^= s.sum[i];
		}
		for (let i = 0; i < this.checksum.length; i++) {
			this.sum[i] ^= s.sum[i];
		}
	}

	isPure(): boolean {
		const checksum = crypto.createHmac("sha1", "").update(this.sum).digest();
		if (checksum.length !== this.checksum.length) {
			return false;
		}
		for (let i = 0; i < checksum.length; i++) {
			if (checksum[i] !== this.checksum[i]) {
				return false;
			}
		}
		return true;
	}
}

export class CodedSymbol extends HashedSymbol {
	count: number;

	constructor(sum: Uint8Array, checksum?: Uint8Array, count = 1) {
		super(sum, checksum);
		this.count = count;
	}

	apply(s: HashedSymbol, direction: number) {
		this.XOR(s);
		this.count += direction;
	}
}
