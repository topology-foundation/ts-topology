/* Logic for compiling Topology CROs to wasm and extracting:
    - Bytecode
    - ABI
*/
import * as fs from "fs";
import asc from "assemblyscript/asc";

export async function compileWasm(path: string) {
  const { error } = await asc.main([
    path,
    "--config=../../asconfig.json",
    "--outFile=dist/tmp.wasm",
    "--target=release"
  ]);

  if (error) {
    console.log("Compilation failed: " + error.message);
    return new Uint8Array();
  } else {
    // read tmp file into uint8array
    const bytecode: Uint8Array = new Uint8Array(fs.readFileSync('dist/tmp.wasm'));
    fs.unlinkSync('dist/tmp.wasm');
    return bytecode;
  }
}
