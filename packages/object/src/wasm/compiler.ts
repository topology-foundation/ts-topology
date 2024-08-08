/* Logic for compiling Topology CROs to wasm and extracting:
    - Bytecode
    - ABI
*/
import asc from "assemblyscript/asc";

export async function compileWasm() {
  const { error, stdout, stderr, stats } = await asc.main([
    // Command line options
    "/Users/droak/code/topology/ts-topology/packages/object/src/chat.ts",
    "--config=/Users/droak/code/topology/ts-topology/packages/object/asconfig.json",
    "--target=release"
  ]);

  if (error) {
    console.log("Compilation failed: " + error.message);
    console.log(stderr.toString());
  } else {
    console.log(stdout.toString());
  }
}
