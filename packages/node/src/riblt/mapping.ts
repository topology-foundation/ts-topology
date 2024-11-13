import * as crypto from "node:crypto";

function rotl(x: bigint, k: bigint) {
	return BigInt.asUintN(64, (x << k) | (x >> (64n - k)));
}

export class RandomMapping {
	private s: BigUint64Array;
	lastIdx: number;

	constructor(seed: Uint8Array, lastIdx = 0) {
		this.s = new BigUint64Array(
			crypto.createHash("sha256").update(seed).digest().buffer,
		);
		this.lastIdx = lastIdx;
	}

	nextIndex(): number {
		// https://prng.di.unimi.it/xoshiro256starstar.c
		const result = BigInt.asUintN(
			64,
			rotl(BigInt.asUintN(64, this.s[1] * 5n), 7n) * 9n,
		);

		const t = BigInt.asUintN(64, this.s[1] << 17n);

		this.s[2] ^= this.s[0];
		this.s[3] ^= this.s[1];
		this.s[1] ^= this.s[2];
		this.s[0] ^= this.s[3];

		this.s[2] ^= t;

		this.s[3] = rotl(this.s[3], 45n);

		this.lastIdx += Math.ceil(
			(this.lastIdx + 1.5) * (2 ** 32 / Math.sqrt(Number(result) + 1) - 1),
		);
		return this.lastIdx;
	}
}
