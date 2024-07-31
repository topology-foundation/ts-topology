import { IPixel, createPixel, pixelColor, pixelPaint, pixelMerge } from "./Pixel";

class Canvas {
  width: i32;
  height: i32;
  canvas: StaticArray<StaticArray<usize>>;

  constructor(width: i32, height: i32) {
    this.width = width;
    this.height = height;
    this.canvas = new StaticArray(width);
    for (let i = 0; i < width; i++) {
      let row = new StaticArray<usize>(height);
      for (let j = 0; j < height; j++) {
        row[j] = changetype<usize>(createPixel());
      }
      this.canvas[i] = row;
    }
  }

  splash(
    nodeId: string,
    offset: StaticArray<i32>,
    size: StaticArray<i32>,
    rgb: StaticArray<i32>
  ): void {
    for (let x = offset[0]; x < this.width && x < offset[0] + size[0]; x++) {
      for (let y = offset[1]; y < this.height && y < offset[1] + size[1]; y++) {
        pixelPaint(changetype<IPixel>(this.canvas[x][y]), nodeId, rgb);
      }
    }
  }

  paint(nodeId: string, offset: StaticArray<i32>, rgb: StaticArray<i32>): void {
    if (offset[0] < 0 || offset[0] >= this.width) return;
    if (offset[1] < 0 || offset[1] >= this.height) return;
    pixelPaint(changetype<IPixel>(this.canvas[offset[0]][offset[1]]), nodeId, rgb);
  }

  pixel(x: i32, y: i32): usize {
    return this.canvas[x][y];
  }

  merge(peerCanvas: Canvas): void {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        pixelMerge(
          changetype<IPixel>(this.canvas[x][y]),
          changetype<IPixel>(peerCanvas.pixel(x, y))
        );
      }
    }
  }
}

let canvasInstance: Canvas | null = null;

export function createCanvas(width: i32, height: i32): void {
  canvasInstance = new Canvas(width, height);
}

export function splash(
  nodeId: string,
  offset: StaticArray<i32>,
  size: StaticArray<i32>,
  rgb: StaticArray<i32>
): void {
  assert(canvasInstance !== null, "Canvas not initialized");
  canvasInstance!.splash(nodeId, offset, size, rgb);
}

export function paint(nodeId: string, offset: StaticArray<i32>, rgb: StaticArray<i32>): void {
  assert(canvasInstance !== null, "Canvas not initialized");
  canvasInstance!.paint(nodeId, offset, rgb);
}

export function pixel(x: i32, y: i32): usize {
  assert(canvasInstance !== null, "Canvas not initialized");
  return canvasInstance!.pixel(x, y);
}

export function merge(peerCanvas: Canvas): void {
  assert(canvasInstance !== null, "Canvas not initialized");
  canvasInstance!.merge(peerCanvas);
}