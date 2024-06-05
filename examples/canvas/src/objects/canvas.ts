import { TopologyObject } from "@topologygg/object";
import { Pixel } from "./pixel";

export class Canvas extends TopologyObject {
  private static _width: number;
  private static _height: number;
  private _canvas: Pixel[][];

  constructor(width: number, height: number) {
    super();
    Canvas._init(width, height);
    this._canvas = Array(width).fill(Array(height).fill(new Pixel()));
  }

  private static _init(width: number, height: number) {
    this._width = width;
    this._height = height;
  }

  splash(
    node_id: string,
    offset: [number, number],
    size: [number, number],
    rgb: [number, number, number],
  ): void {
    if (offset[0] < 0 || Canvas._width < offset[0]) return;
    if (offset[1] < 0 || Canvas._height < offset[1]) return;

    for (let x = offset[0]; x < Canvas._width || x < offset[0] + size[0]; x++) {
      for (
        let y = offset[1];
        y < Canvas._height || y < offset[1] + size[1];
        y++
      ) {
        this._canvas[x][y].paint(node_id, rgb);
      }
    }
  }

  paint(
    nodeId: string,
    offset: [number, number],
    rgb: [number, number, number],
  ): void {
    if (offset[0] < 0 || this._canvas.length < offset[0]) return;
    if (offset[1] < 0 || this._canvas[offset[0]].length < offset[1]) return;

    this._canvas[offset[0]][offset[1]].paint(nodeId, rgb);
  }

  canvas(): [number, number, number][][] {
    return this._canvas.map((row) => row.map((pixel) => pixel.color()));
  }

  pixel(x: number, y: number): Pixel {
    return this._canvas[x][y];
  }

  merge(peerCanvas: Canvas): void {
    this._canvas.forEach((row, x) =>
      row.forEach((pixel, y) => pixel.merge(peerCanvas.pixel(x, y))),
    );
  }
}
