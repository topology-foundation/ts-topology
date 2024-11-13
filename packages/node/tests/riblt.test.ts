import { beforeEach, describe, expect, test } from "vitest";
import { Encoder } from "../src/riblt/encoder.js";
import { Decoder } from "../src/riblt/decoder.js";
import { SymbolFactory, type SourceSymbol } from "../src/riblt/symbol.js";
import * as crypto from 'node:crypto';


class VertexSymbol implements SourceSymbol {
    data: number;

    constructor(data: number) {
        this.data = data;
    }

    xor(s: VertexSymbol): void {
        this.data ^= s.data;
    }

    hash(): Uint8Array {
        return new Uint8Array(crypto.createHash('sha1').update(new Uint32Array([this.data])).digest());
    }

    equals(s: VertexSymbol): boolean {
        return this.data === s.data;
    }

    toString(): string {
        return `${this.data}`;
    }
}


class VertexSymbolFactory extends SymbolFactory<VertexSymbol> {
    emptySource(): VertexSymbol {
        return new VertexSymbol(0);
    }

    emptyHash(): Uint8Array {
        return new Uint8Array(20);
    }

    cloneSource(s: VertexSymbol): VertexSymbol {
        return new VertexSymbol(s.data);
    }

    newTestSymbol(i): VertexSymbol {
        return new VertexSymbol(i);
    }
}


describe("RIBLT test", async () => {
    const factory = new VertexSymbolFactory();


    test.each([10])("d=%i", async (d) => {
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
            const remoteSymbol = factory.cloneSource(localSymbol);
            localEncoder.addSymbol(localSymbol);
            remoteEncoder.addSymbol(remoteSymbol);
        }

        let sequenceSize = 0;
        do {
            sequenceSize++;
            localEncoder.producePrefix(sequenceSize);
            remoteEncoder.producePrefix(sequenceSize);
            console.log(`localEncoder[${sequenceSize - 1}]: ${localEncoder.codedSymbols[sequenceSize - 1]}`);
            console.log(`remoteEncoder[${sequenceSize - 1}]: ${remoteEncoder.codedSymbols[sequenceSize - 1]}`);
            localDecoder.addCodedSymbol(sequenceSize - 1, localEncoder.codedSymbols[sequenceSize - 1], remoteEncoder.codedSymbols[sequenceSize - 1]);
            console.log(`localDecoder[${sequenceSize - 1}]: ${localDecoder.codedSymbols[sequenceSize - 1]}`);
        } while (!localDecoder.tryDecode());

        // console.log(localDecoder.decodedLocalSymbols);
        // console.log(localDecoder.decodedRemoteSymbols);
        // console.log(localDecoder.remaining);

        console.log(sequenceSize);
    });
});
