/* Logic for compiling Topology CROs to wasm and extracting:
    - Bytecode
    - ABI
*/
import * as fs from "node:fs";
import asc from "assemblyscript/asc";
export async function compileWasm(path) {
    console.log("Compiling", path);
    const { error, stderr } = await asc.main([path, "--bindings=esm", "--outFile=/tmp/dist.wasm"], {
        readFile: (filename) => {
            if (!fs.existsSync(filename))
                return null;
            return fs
                .readFileSync(filename, "utf8")
                .replace("@topology-foundation/blueprints", "@topology-foundation/blueprints/src/index.asc");
        },
        writeFile: (filename, contents, baseDir) => fs.writeFileSync(filename, contents),
        listFiles: () => [],
    });
    if (error) {
        console.log(`Compilation failed: ${error}`);
        console.log(stderr.toString());
        return new Uint8Array();
    }
    // read tmp file into uint8array
    const bytecode = new Uint8Array(fs.readFileSync("/tmp/dist.wasm"));
    // fs.unlinkSync('dist/tmp.wasm');
    console.log("Compilation successful", bytecode);
    return bytecode;
}
