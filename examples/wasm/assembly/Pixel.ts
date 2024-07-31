import { GCounter } from "./GCounter";

export class Pixel {
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

  merge(peerPixel: Pixel): void {
    this.red.merge(peerPixel.red);
    this.green.merge(peerPixel.green);
    this.blue.merge(peerPixel.blue);
  }
}

export function createPixel(): Pixel {
  return new Pixel();
}
