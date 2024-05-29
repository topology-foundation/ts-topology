import { Pixel } from "./pixel";

export class Canvas {
  private _width: number;
  private _height: number;
  private _canvas: Pixel[][];

  constructor(width: number, height: number) {
    this._width = width;
    this._height = height;
    this._canvas = Array(width).fill(Array(height).fill(new Pixel()));
  }

  splash(
    node_id: string,
    offset: [number, number],
    size: [number, number],
    rgb: [number, number, number],
  ): void {
    if (offset[0] < 0 || this._width < offset[0]) return;
    if (offset[1] < 0 || this._height < offset[1]) return;

    for (let x = offset[0]; x < this._width || x < offset[0] + size[0]; x++) {
      for (
        let y = offset[1];
        y < this._height || y < offset[1] + size[1];
        y++
      ) {
        this._canvas[x][y].paint(node_id, rgb);
      }
    }
  }

  paint(
    node_id: string,
    offset: [number, number],
    rgb: [number, number, number],
  ): void {
    if (offset[0] < 0 || this._canvas.length < offset[0]) return;
    if (offset[1] < 0 || this._canvas[offset[0]].length < offset[1]) return;

    this._canvas[offset[0]][offset[1]].paint(node_id, rgb);
  }

  canvas(): [number, number, number][][] {
    return this._canvas.map((row) => row.map((pixel) => pixel.color()));
  }

  pixel(x: number, y: number): Pixel {
    return this._canvas[x][y];
  }

  merge(peer_canvas: Canvas): void {
    this._canvas.forEach((row, x) =>
      row.forEach((pixel, y) => pixel.merge(peer_canvas.pixel(x, y))),
    );
  }
}
