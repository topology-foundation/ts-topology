import { loadWasmModule } from "./wasmLoader";

async function main() {
  const canvasWasm = await loadWasmModule("/build/canvas.wasm");
  const pixelWasm = await loadWasmModule("/build/pixel.wasm");

  (window as any).canvasWasm = canvasWasm;
  (window as any).pixelWasm = pixelWasm;

  console.log("WASM Modules Loaded", { canvasWasm, pixelWasm });
}

main();
