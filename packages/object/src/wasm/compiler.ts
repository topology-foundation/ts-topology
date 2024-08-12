/* Logic for compiling Topology CROs to wasm and extracting:
    - Bytecode
    - ABI
*/
import * as fs from "fs";
import asc from "assemblyscript/asc";

export async function compileWasm() {
  const { error, stdout, stderr, stats } = await asc.main([
    // Command line options
    "/Users/droak/code/topology/ts-topology/packages/object/src/chat.ts",
    "--config=/Users/droak/code/topology/ts-topology/packages/object/asconfig.json",
    "--outFile=dist/tmp.wasm",
    "--target=release"
  ]);

  if (error) {
    console.log("Compilation failed: " + error.message);
    console.log(stderr.toString());
  } else {
    // read tmp file and delete it
    const bytecode = fs.readFileSync('dist/tmp.wasm');
    fs.unlinkSync('dist/tmp.wasm');
    return bytecode;
  }
}
