import { GCounter } from "@topology-foundation/crdt-wasm/assembly";

export interface IPixel {
  red: GCounter;
  green: GCounter;
  blue: GCounter;
  color(): StaticArray<i32>;
  paint(nodeId: string, rgb: StaticArray<i32>): void;
  merge(peerPixel: IPixel): void;
}

class Pixel implements IPixel {
  red: GCounter;
  green: GCounter;
  blue: GCounter;

  constructor() {
    this.red = new GCounter();
    this.green = new GCounter();
    this.blue = new GCounter();
  }

  color(): StaticArray<i32> {
    return [
      this.red.value() % 256,
      this.green.value() % 256,
      this.blue.value() % 256,
    ];
  }

  paint(nodeId: string, rgb: StaticArray<i32>): void {
    this.red.increment(nodeId, rgb[0]);
    this.green.increment(nodeId, rgb[1]);
    this.blue.increment(nodeId, rgb[2]);
  }

  merge(peerPixel: IPixel): void {
    this.red.merge(peerPixel.red);
    this.green.merge(peerPixel.green);
    this.blue.merge(peerPixel.blue);
  }
}

export function createPixel(): IPixel {
  return new Pixel();
}

export function pixelColor(pixel: IPixel): StaticArray<i32> {
  return pixel.color();
}

export function pixelPaint(pixel: IPixel, nodeId: string, rgb: StaticArray<i32>): void {
  pixel.paint(nodeId, rgb);
}

export function pixelMerge(pixel: IPixel, peerPixel: IPixel): void {
  pixel.merge(peerPixel);
}