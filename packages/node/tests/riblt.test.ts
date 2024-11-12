import { beforeEach, describe, expect, test } from "vitest";
import { Encoder } from "../src/riblt/encoder.js";
import { Decoder } from "../src/riblt/decoder.js";
import type { SourceSymbolFactory, SourceSymbol } from "../src/riblt/symbol.js";
import * as crypto from 'node:crypto';


class VertexSymbol implements SourceSymbol {
    data: Uint8Array;

    constructor(data: Uint8Array) {
        this.data = data;
    }

    xor(s: VertexSymbol): void {
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] ^= s.data[i];
        }
    }

    hash(): Uint8Array {
        return crypto.createHash('sha1').update(this.data).digest();
    }

    equals(s: VertexSymbol): boolean {
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i] !== s.data[i]) {
                return false;
            }
        }
        return true;
    }
}


class VertexSymbolFactory implements SourceSymbolFactory<VertexSymbol> {
    empty(): VertexSymbol {
        return new VertexSymbol(new Uint8Array(32));
    }

    emptyHash(): Uint8Array {
        return new Uint8Array(20);
    }

    clone(s: VertexSymbol): VertexSymbol {
        return new VertexSymbol(new Uint8Array(s.data));
    }
}


describe("RIBLT test", async () => {
    const factory = new VertexSymbolFactory();
	const v0 = factory.empty();
    const v1 = factory.empty();
    const v2 = factory.empty();

    v0.data[0] = 1;
    v1.data[0] = 2;
    v2.data[0] = 4;

    const aliceEncoder = new Encoder(factory);
    const bobEncoder = new Encoder(factory);

    aliceEncoder.addSymbol(v0);
    aliceEncoder.addSymbol(v2);

    bobEncoder.addSymbol(v1);
    bobEncoder.addSymbol(v2);

    aliceEncoder.extendPrefix(10);
    bobEncoder.extendPrefix(10);

    const bobDecoder = new Decoder(factory);

    for (let i = 0; i < 10; i++) {
        // console.log(`${i}: ${aliceEncoder.codedSymbols[i].sum.data} ${aliceEncoder.codedSymbols[i].count} ${bobEncoder.codedSymbols[i].sum.data} ${bobEncoder.codedSymbols[i].count}`);
        bobDecoder.applyCodedSymbol(i, aliceEncoder.codedSymbols[i], bobEncoder.codedSymbols[i]);
    }

    // for (let i = 0; i < 10; i++) {
    //     console.log(`Decoded: ${bobDecoder.codedSymbols[i].sum.data} ${bobDecoder.codedSymbols[i].count}`);
    // }

    expect(bobDecoder.tryDecode()).toBe(true);
    console.log(bobDecoder.decodedSymbols);
});
