export async function loadWasmModule(path: string): Promise<any> {
    const response = await fetch(path);
    const buffer = await response.arrayBuffer();
    const module = await WebAssembly.instantiate(buffer);
    return module.instance.exports;
  }
  