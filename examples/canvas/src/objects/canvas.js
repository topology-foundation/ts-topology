"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Canvas = void 0;
const object_1 = require("@topology-foundation/object");
const pixel_1 = require("./pixel");
class Canvas {
    operations = ["splash", "paint"];
    semanticsType = object_1.SemanticsType.pair;
    width;
    height;
    canvas;
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.canvas = Array.from(new Array(width), () => Array.from(new Array(height), () => new pixel_1.Pixel()));
    }
    splash(offset, size, rgb) {
        this._splash(offset, size, rgb);
    }
    paint(offset, rgb) {
        this._paint(offset, rgb);
    }
    _splash(offset, size, rgb) {
        if (offset[0] < 0 || this.width < offset[0])
            return;
        if (offset[1] < 0 || this.height < offset[1])
            return;
        for (let x = offset[0]; x < this.width || x < offset[0] + size[0]; x++) {
            for (let y = offset[1]; y < this.height || y < offset[1] + size[1]; y++) {
                this.canvas[x][y].paint(rgb);
            }
        }
    }
    _paint(offset, rgb) {
        if (offset[0] < 0 || this.canvas.length < offset[0])
            return;
        if (offset[1] < 0 || this.canvas[offset[0]].length < offset[1])
            return;
        this.canvas[offset[0]][offset[1]].paint(rgb);
    }
    pixel(x, y) {
        return this.canvas[x][y];
    }
    resolveConflicts(_) {
        return { action: object_1.ActionType.Nop };
    }
    mergeCallback(operations) {
        this.canvas = Array.from(new Array(this.width), () => Array.from(new Array(this.height), () => new pixel_1.Pixel()));
        for (const op of operations) {
            if (!op.value)
                continue;
            switch (op.type) {
                case "splash": {
                    const [nodeId, offset, size, rgb] = op.value;
                    this._splash(offset, size, rgb);
                    break;
                }
                case "paint": {
                    const [nodeId, offset, rgb] = op.value;
                    this._paint(offset, rgb);
                    break;
                }
            }
        }
    }
}
exports.Canvas = Canvas;
