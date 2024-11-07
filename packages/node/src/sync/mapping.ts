export class RandomMapping {
    private prng: bigint;
    lastIdx: number;
  
    constructor(prng: number, lastIdx = 0) {
        this.prng = BigInt(prng);
        this.lastIdx = lastIdx;
    }

    nextIndex(): number {
        const multiplier = 0xda942042e4dd58b5n;
        this.prng = (this.prng * multiplier) & 0xffffffffffffffffn;

        this.lastIdx += Math.ceil((this.lastIdx + 1.5) * ((2 ** 32) / Math.sqrt(Number(this.prng) + 1) - 1));
        return this.lastIdx;
    }
}
