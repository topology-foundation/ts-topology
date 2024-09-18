export class Pixel {
	red: number;
	green: number;
	blue: number;

	constructor(red?: number, green?: number, blue?: number) {
		this.red = red ?? 0;
		this.green = green ?? 0;
		this.blue = blue ?? 0;
	}

	color(): [number, number, number] {
		return [this.red % 256, this.green % 256, this.blue % 256];
	}

	counters(): [number, number, number] {
		return [this.red, this.green, this.blue];
	}

	paint(rgb: [number, number, number]): void {
		this.red += rgb[0];
		this.green += rgb[1];
		this.blue += rgb[2];
	}
}
