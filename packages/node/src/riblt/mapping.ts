import * as crypto from "node:crypto";


export class RandomMapping {
	private state: Uint8Array;
	lastIdx: number;

	constructor(seed: Uint8Array, lastIdx = 0) {
		this.state = crypto.createHash("sha1").update(seed).digest();
		this.lastIdx = lastIdx;
	}

	nextIndex(): number {
		let prng = 0n;
		prng |= BigInt(this.state[0]) << 0n;
		prng |= BigInt(this.state[1]) << 8n;
		prng |= BigInt(this.state[2]) << 16n;
		prng |= BigInt(this.state[3]) << 24n;
		prng |= BigInt(this.state[4]) << 32n;
		prng |= BigInt(this.state[5]) << 40n;
		prng |= BigInt(this.state[6]) << 48n;
		prng |= BigInt(this.state[7]) << 56n;
		this.lastIdx += Math.ceil(
			(this.lastIdx + 1.5) * (2 ** 32 / Math.sqrt(Number(prng) + 1) - 1),
		);
		this.state = crypto.createHash("sha1").update(this.state).digest();
		return this.lastIdx;
	}
}
