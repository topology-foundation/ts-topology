/* Logic for compiling Topology CROs to wasm and extracting:
    - Bytecode
    - ABI
*/
import * as fs from "fs";
import asc from "assemblyscript/asc";

export async function compileWasm(path: string) {
  console.log("Compiling", path);
  const { error } = await asc.main([
    path,
    "--bindings=esm",
    "--outFile=/tmp/dist.wasm",
  ], {
    readFile: (filename: string) =>
      fs.existsSync(filename) ? fs.readFileSync(filename, "utf8") : null,
    writeFile: (filename: string, contents: string | Uint8Array, baseDir: string) => {
      if (typeof contents === "string") {
        contents.replace('@topology-foundation/crdt', '@topology-foundation/crdt/src/index.asc')
      } else {
        contents = new TextDecoder().decode(contents)
        contents.replace('@topology-foundation/crdt', '@topology-foundation/crdt/src/index.asc')
      }
      return fs.writeFileSync(filename, contents)
    },
    listFiles: () => []
  });

  if (error) {
    console.log("Compilation failed: " + error);
    return new Uint8Array();
  } else {
    // read tmp file into uint8array
    const bytecode: Uint8Array = new Uint8Array(fs.readFileSync('/tmp/dist.wasm'));
    // fs.unlinkSync('dist/tmp.wasm');
    console.log("Compilation successful", bytecode);
    return bytecode;
  }
}
