import { TopologyObject } from "@topology-foundation/object";
import { IPixel, Pixel } from "./pixel";

export interface ICanvas {
  width: number;
  height: number;
  canvas: IPixel[][];
  splash(
    node_id: string,
    offset: [number, number],
    size: [number, number],
    rgb: [number, number, number],
  ): void;
  paint(
    nodeId: string,
    offset: [number, number],
    rgb: [number, number, number],
  ): void;
  pixel(x: number, y: number): IPixel;
  merge(peerCanvas: Canvas): void;
}

export class Canvas implements TopologyObject, ICanvas {
  width: number;
  height: number;
  canvas: IPixel[][];

  constructor(peerId: string, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas = Array.from(new Array(width), () =>
      Array.from(new Array(height), () => new Pixel(peerId)),
    );
  }

  splash(
    node_id: string,
    offset: [number, number],
    size: [number, number],
    rgb: [number, number, number],
  ): void {
    if (offset[0] < 0 || this.width < offset[0]) return;
    if (offset[1] < 0 || this.height < offset[1]) return;

    for (let x = offset[0]; x < this.width || x < offset[0] + size[0]; x++) {
      for (let y = offset[1]; y < this.height || y < offset[1] + size[1]; y++) {
        this.canvas[x][y].paint(node_id, rgb);
      }
    }
  }

  paint(
    nodeId: string,
    offset: [number, number],
    rgb: [number, number, number],
  ): void {
    if (offset[0] < 0 || this.canvas.length < offset[0]) return;
    if (offset[1] < 0 || this.canvas[offset[0]].length < offset[1]) return;

    this.canvas[offset[0]][offset[1]].paint(nodeId, rgb);
  }

  pixel(x: number, y: number): IPixel {
    return this.canvas[x][y];
  }

  merge(peerCanvas: Canvas): void {
    this.canvas.forEach((row, x) =>
      row.forEach((pixel, y) => pixel.merge(peerCanvas.pixel(x, y))),
    );
  }
}
