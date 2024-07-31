import { loadWasmModule } from "./wasmLoader";

async function main() {
  const canvasWasm = await loadWasmModule("../build/canvas.wasm");
  const pixelWasm = await loadWasmModule("../build/pixel.wasm");

  const width = 5;
  const height = 10;
  const canvas = new canvasWasm.Canvas(width, height);
  canvas.splash("peerId", [0, 0], [2, 2], [255, 0, 0]);

  console.log(canvas);
}

main();
