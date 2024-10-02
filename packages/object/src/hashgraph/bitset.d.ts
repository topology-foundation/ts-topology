export declare class BitSet {
    private data;
    constructor(size?: number);
    clear(): void;
    set(index: number, value: boolean): void;
    get(index: number): boolean;
    flip(index: number): void;
    and(other: BitSet): BitSet;
    or(other: BitSet): BitSet;
    xor(other: BitSet): BitSet;
    not(): BitSet;
    toString(): string;
}
//# sourceMappingURL=bitset.d.ts.map