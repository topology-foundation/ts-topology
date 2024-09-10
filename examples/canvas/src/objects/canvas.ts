import { Pixel } from "./pixel";
import {
	ActionType,
	type CRO,
	type Operation,
} from "@topology-foundation/object";

export class Canvas implements CRO {
	operations: string[] = ["splash", "paint"];

	width: number;
	height: number;
	canvas: Pixel[][];

	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.canvas = Array.from(new Array(width), () =>
			Array.from(new Array(height), () => new Pixel()),
		);
	}

	splash(
		nodeId: string,
		offset: [number, number],
		size: [number, number],
		rgb: [number, number, number],
	): void {
		if (offset[0] < 0 || this.width < offset[0]) return;
		if (offset[1] < 0 || this.height < offset[1]) return;

		for (let x = offset[0]; x < this.width || x < offset[0] + size[0]; x++) {
			for (let y = offset[1]; y < this.height || y < offset[1] + size[1]; y++) {
				this.canvas[x][y].paint(nodeId, rgb);
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

	pixel(x: number, y: number): Pixel {
		return this.canvas[x][y];
	}

	merge(peerCanvas: Canvas): void {
		this.canvas.forEach((row, x) =>
			row.forEach((pixel, y) => pixel.merge(peerCanvas.pixel(x, y))),
		);
	}

	resolveConflicts(_): ActionType {
		return ActionType.Nop;
	}

	mergeCallback(operations: Operation[]): void {
		for (const op of operations) {
			if (!op.value) continue;
			this.merge(op.value);
		}
	}
}
