import { loadWasmModule } from "./wasmLoader";

async function main() {
  const canvasWasm = await loadWasmModule("/build/canvas.wasm");

  (window as any).canvasWasm = canvasWasm;

  console.log("WASM Module Loaded", { canvasWasm });
}

main();