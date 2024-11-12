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

    newTestSymbol(i): VertexSymbol {
        const data = new Uint32Array(8);
        data[0] = i;
        return new VertexSymbol(new Uint8Array(data.buffer));
    }
}


describe("RIBLT test", async () => {
    const factory = new VertexSymbolFactory();


    test.each([10, 20, 40, 100])("d=%i", async (d) => {
        const nlocal = d >> 1;
        const nremote = d >> 1;
        const ncommon = d;

        let symbolIndex = 0;

        const localEncoder = new Encoder(factory);
        const remoteEncoder = new Encoder(factory);
        const localDecoder = new Decoder(factory);

        const localSymbols: VertexSymbol[] = [];
        const remoteSymbols: VertexSymbol[] = [];

        for (let i = 0; i < nlocal; i++) {
            const localSymbol = factory.newTestSymbol(symbolIndex++);
            localSymbols.push(localSymbol);
            localEncoder.addSymbol(localSymbol);
        }
        for (let i = 0; i < nremote; i++) {
            const remoteSymbol = factory.newTestSymbol(symbolIndex++);
            remoteSymbols.push(remoteSymbol);
            remoteEncoder.addSymbol(remoteSymbol);
        }
        for (let i = 0; i < ncommon; i++) {
            const localSymbol = factory.newTestSymbol(symbolIndex++);
            const remoteSymbol = factory.clone(localSymbol);
            localEncoder.addSymbol(localSymbol);
            remoteEncoder.addSymbol(remoteSymbol);
        }

        let sequenceSize = 0;
        do {
            sequenceSize++;
            localEncoder.extendPrefix(sequenceSize);
            remoteEncoder.extendPrefix(sequenceSize);
            localDecoder.addCodedSymbol(sequenceSize - 1, localEncoder.codedSymbols[sequenceSize - 1], remoteEncoder.codedSymbols[sequenceSize - 1]);
        } while (!localDecoder.tryDecode());

        // console.log(localDecoder.decodedLocalSymbols);
        // console.log(localDecoder.decodedRemoteSymbols);
        // console.log(localDecoder.remaining);

        console.log(sequenceSize);
    });
});
