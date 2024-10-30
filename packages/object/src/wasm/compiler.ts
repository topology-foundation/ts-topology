/* Logic for compiling Topology CROs to wasm and extracting:
    - Bytecode
    - ABI
*/
import * as fs from "node:fs";
import { Logger } from "@topology-foundation/logger";
import asc from "assemblyscript/asc";

export async function compileWasm(path: string) {
	const log = new Logger("topology::wasm", { level: "info" });

	log.info("Compiling", path);
	const { error, stderr } = await asc.main(
		[path, "--bindings=esm", "--outFile=/tmp/dist.wasm"],
		{
			readFile: (filename: string) => {
				if (!fs.existsSync(filename)) return null;
				return fs
					.readFileSync(filename, "utf8")
					.replace(
						"@topology-foundation/blueprints",
						"@topology-foundation/blueprints/src/index.asc",
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
		log.info(`Compilation failed: ${error}`);
		log.info(stderr.toString());
		return new Uint8Array();
	}

	// read tmp file into uint8array
	const bytecode: Uint8Array = new Uint8Array(
		fs.readFileSync("/tmp/dist.wasm"),
	);
	// fs.unlinkSync('dist/tmp.wasm');
	log.info("Compilation successful", bytecode);
	return bytecode;
}
