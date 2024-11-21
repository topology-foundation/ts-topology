import * as crypto from "node:crypto";
import { beforeEach, describe, expect, test } from "vitest";
import { Decoder } from "../src/riblt/decoder.js";
import { Encoder } from "../src/riblt/encoder.js";
import { CodedSymbol, type SourceSymbol } from "../src/riblt/symbol.js";

class VertexSymbol implements SourceSymbol {
	data: number;

	constructor(data: number) {
		this.data = data;
	}

	xor(s: VertexSymbol): void {
		this.data ^= s.data;
	}

	hash(): Uint8Array {
		return new Uint8Array(
			crypto
				.createHash("sha1")
				.update(new Uint32Array([this.data]))
				.digest(),
		);
	}

	equals(s: VertexSymbol): boolean {
		return this.data === s.data;
	}

	toString(): string {
		return `${this.data}`;
	}
}

describe("RIBLT test", async () => {
	test.each([10, 20, 40, 100, 1000, 10000, 50000, 100000, 200000])(
		"d=%i",
		async (d) => {
			const nlocal = d >> 1;
			const nremote = d >> 1;
			const ncommon = d;

			let symbolIndex = 0;

			const newCodedSymbol = () =>
				new CodedSymbol(new VertexSymbol(0), new Uint8Array(20), 0);

			const localEncoder = new Encoder(newCodedSymbol);
			const remoteEncoder = new Encoder(newCodedSymbol);
			const localDecoder = new Decoder(newCodedSymbol);

			enum SymbolState {
				Local = 0,
				Remote = 1,
				Common = 2,
			}
			const symbolState: SymbolState[] = [];

			for (let i = 0; i < nlocal; i++) {
				const localSymbol = new VertexSymbol(symbolIndex);
				symbolState.push(SymbolState.Local);
				localEncoder.addSymbol(localSymbol);
				symbolIndex++;
			}
			for (let i = 0; i < nremote; i++) {
				const remoteSymbol = new VertexSymbol(symbolIndex);
				symbolState.push(SymbolState.Remote);
				remoteEncoder.addSymbol(remoteSymbol);
				symbolIndex++;
			}
			for (let i = 0; i < ncommon; i++) {
				const localSymbol = new VertexSymbol(symbolIndex);
				const remoteSymbol = new VertexSymbol(symbolIndex);
				symbolState.push(SymbolState.Common);
				localEncoder.addSymbol(localSymbol);
				remoteEncoder.addSymbol(remoteSymbol);
				symbolIndex++;
			}

			let sequenceSize = 0;
			do {
				sequenceSize++;
				localEncoder.producePrefix(sequenceSize);
				remoteEncoder.producePrefix(sequenceSize);
				localDecoder.addCodedSymbol(
					sequenceSize - 1,
					localEncoder.codedSymbols[sequenceSize - 1],
					remoteEncoder.codedSymbols[sequenceSize - 1],
				);
			} while (!localDecoder.tryDecode());

			const visited = new Array<boolean>(symbolIndex).fill(false);

			for (const symbol of localDecoder.decodedLocalSymbols as VertexSymbol[]) {
				expect(Number.isInteger(symbol.data)).toBe(true);
				expect(symbol.data >= 0 && symbol.data < symbolIndex).toBe(true);
				expect(visited[symbol.data]).toBe(false);
				visited[symbol.data] = true;
				expect(symbolState[symbol.data]).toBe(SymbolState.Local);
			}
			for (const symbol of localDecoder.decodedRemoteSymbols as VertexSymbol[]) {
				expect(Number.isInteger(symbol.data)).toBe(true);
				expect(symbol.data >= 0 && symbol.data < symbolIndex).toBe(true);
				expect(visited[symbol.data]).toBe(false);
				visited[symbol.data] = true;
				expect(symbolState[symbol.data]).toBe(SymbolState.Remote);
			}

			console.log(
				`${sequenceSize} symbols, ${(sequenceSize / d).toFixed(3)} symbols/diff`,
			);
		},
	);
});
