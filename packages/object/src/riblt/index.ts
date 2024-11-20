import * as crypto from "node:crypto";
import type * as ObjectPb from "../proto/topology/object/object_pb.js";
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

export class VertexHashEncoder extends Encoder<VertexHash> {
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

	getEncoded(index: number): ObjectPb.CodedSymbol {
		this.producePrefix(index + 1);
		return {
			sum: new Uint8Array(this.codedSymbols[index].sum.data.buffer),
			checksum: this.codedSymbols[index].checksum,
			count: this.codedSymbols[index].count,
		};
	}
}

export class VertexHashDecoder extends Decoder<VertexHash> {
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
				hash += symbol.data[i].toString(16).padStart(2, "0");
			}
			return hash;
		});
	}

	getDecodedRemote(): string[] {
		return this.decodedRemoteSymbols.map((symbol) => {
			let hash = "";
			for (let i = 0; i < 32; i++) {
				hash += symbol.data[i].toString(16).padStart(2, "0");
			}
			return hash;
		});
	}
}
