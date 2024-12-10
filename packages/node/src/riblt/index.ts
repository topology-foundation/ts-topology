import * as crypto from "node:crypto";
import { ObjectPb } from "@topology-foundation/object";
import { Decoder } from "./decoder.js";
import { Encoder } from "./encoder.js";
import { CodedSymbol, type SourceSymbol } from "./symbol.js";

class VertexHash implements SourceSymbol {
	data: Uint8Array;

	constructor(data: Uint8Array) {
		this.data = data;
	}

	xor(s: VertexHash): void {
		for (let i = 0; i < 32; i++) {
			this.data[i] ^= s.data[i];
		}
	}

	hash(): Uint8Array {
		return new Uint8Array(crypto.createHash("sha1").update(this.data).digest());
	}
}

const newCodedSymbol = () =>
	new CodedSymbol(new VertexHash(new Uint8Array(32)), new Uint8Array(20), 0);

export class VertexHashEncoder extends Encoder {
	constructor() {
		super(newCodedSymbol);
	}

	add(hash: string) {
		const data = new Uint8Array(32);
		for (let i = 0; i < 32; i++) {
			data[i] = Number.parseInt(hash.slice(i * 2, (i + 1) * 2), 16);
		}
		super.addSymbol(new VertexHash(data));
	}

	getEncoded(size: number): ObjectPb.CodedSymbol[] {
		this.producePrefix(size);
		return this.codedSymbols.slice(0, size).map((symbol) =>
			ObjectPb.CodedSymbol.create({
				sum: new Uint8Array((symbol.sum as VertexHash).data.buffer),
				checksum: symbol.checksum,
				count: symbol.count,
			}),
		);
	}
}

export class VertexHashDecoder extends Decoder {
	constructor() {
		super(newCodedSymbol);
	}

	add(
		index: number,
		localSymbol: ObjectPb.CodedSymbol,
		remoteSymbol: ObjectPb.CodedSymbol,
	) {
		super.addCodedSymbol(
			index,
			new CodedSymbol(
				new VertexHash(localSymbol.sum),
				localSymbol.checksum,
				localSymbol.count,
			),
			new CodedSymbol(
				new VertexHash(remoteSymbol.sum),
				remoteSymbol.checksum,
				remoteSymbol.count,
			),
		);
	}

	getDecodedLocal(): string[] {
		return this.decodedLocalSymbols.map((symbol) => {
			let hash = "";
			for (let i = 0; i < 32; i++) {
				hash += (symbol as VertexHash).data[i].toString(16).padStart(2, "0");
			}
			return hash;
		});
	}

	getDecodedRemote(): string[] {
		return this.decodedRemoteSymbols.map((symbol) => {
			let hash = "";
			for (let i = 0; i < 32; i++) {
				hash += (symbol as VertexHash).data[i].toString(16).padStart(2, "0");
			}
			return hash;
		});
	}
}
