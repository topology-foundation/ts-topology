/* Logic for compiling Topology CROs to wasm and extracting:
    - Bytecode
    - ABI
*/
import * as fs from "node:fs";
import asc from "assemblyscript/asc";

export async function compileWasm(path: string) {
	console.log("Compiling", path);
	const { error, stderr } = await asc.main(
		[path, "--bindings=esm", "--outFile=/tmp/dist.wasm"],
		{
			readFile: (filename: string) => {
				if (!fs.existsSync(filename)) return null;
				return fs
					.readFileSync(filename, "utf8")
					.replace(
						"@topology-foundation/crdt",
						"@topology-foundation/crdt/src/index.asc",
					);
			},
			writeFile: (
				filename: string,
				contents: string | Uint8Array,
				baseDir: string,
			) => fs.writeFileSync(filename, contents),
			listFiles: () => [],
		},
	);

	if (error) {
		console.log(`Compilation failed: ${error}`);
		console.log(stderr.toString());
		return new Uint8Array();
	}

	// read tmp file into uint8array
	const bytecode: Uint8Array = new Uint8Array(
		fs.readFileSync("/tmp/dist.wasm"),
	);
	// fs.unlinkSync('dist/tmp.wasm');
	console.log("Compilation successful", bytecode);
	return bytecode;
}
