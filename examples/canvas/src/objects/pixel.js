"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pixel = void 0;
class Pixel {
    red;
    green;
    blue;
    constructor(red, green, blue) {
        this.red = red ?? 0;
        this.green = green ?? 0;
        this.blue = blue ?? 0;
    }
    color() {
        return [this.red % 256, this.green % 256, this.blue % 256];
    }
    counters() {
        return [this.red, this.green, this.blue];
    }
    paint(rgb) {
        this.red += rgb[0];
        this.green += rgb[1];
        this.blue += rgb[2];
    }
}
exports.Pixel = Pixel;
