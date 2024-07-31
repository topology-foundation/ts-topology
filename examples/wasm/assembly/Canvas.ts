import { Pixel } from "./Pixel";

export class Canvas {
  width: i32;
  height: i32;
  canvas: StaticArray<StaticArray<Pixel>>;

  constructor(width: i32, height: i32) {
    this.width = width;
    this.height = height;
    this.canvas = new StaticArray(width);
    for (let i = 0; i < width; i++) {
      let row = new StaticArray<Pixel>(height);
      for (let j = 0; j < height; j++) {
        row[j] = new Pixel();
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
        this.canvas[x][y].paint(nodeId, rgb);
      }
    }
  }

  paint(nodeId: string, offset: StaticArray<i32>, rgb: StaticArray<i32>): void {
    if (offset[0] < 0 || offset[0] >= this.width) return;
    if (offset[1] < 0 || offset[1] >= this.height) return;
    this.canvas[offset[0]][offset[1]].paint(nodeId, rgb);
  }

  pixel(x: i32, y: i32): Pixel {
    return this.canvas[x][y];
  }

  merge(peerCanvas: Canvas): void {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.canvas[x][y].merge(peerCanvas.pixel(x, y));
      }
    }
  }
}

export function createCanvas(width: i32, height: i32): Canvas {
  return new Canvas(width, height);
}
