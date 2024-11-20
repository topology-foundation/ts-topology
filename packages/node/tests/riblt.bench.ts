import * as crypto from "node:crypto";
import Benchmark from "benchmark";
import { VertexHashDecoder, VertexHashEncoder } from "../src/riblt/index.js";

function benchmarkForEncoding(name: string, numVertices: number, size: number) {
	const hashes: string[] = [];
	for (let i = 0; i < numVertices; i++) {
		hashes.push(crypto.createHash("sha256").update(i.toString()).digest("hex"));
	}
	return suite.add(name, () => {
		const encoder = new VertexHashEncoder();
		for (let i = 0; i < numVertices; i++) {
			encoder.add(hashes[i]);
		}
		encoder.producePrefix(size);
	});
}

const suite = new Benchmark.Suite();

benchmarkForEncoding("Encode 1000 vertices to 1000 symbols", 1000, 1000);
benchmarkForEncoding(
	"Encode 100000 vertices to 100000 symbols",
	100000,
	100000,
);

suite
	.on("cycle", (event) => {
		console.log(String(event.target));
	})
	.on("complete", function () {
		console.log(`Fastest is ${this.filter("fastest").map("name")}`);
	})
	.run({ async: true });
