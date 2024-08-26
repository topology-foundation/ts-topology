import { GCounter } from "@topology-foundation/crdt";

export class Pixel {
	red: GCounter;
	green: GCounter;
	blue: GCounter;

	constructor() {
		this.red = new GCounter({});
		this.green = new GCounter({});
		this.blue = new GCounter({});
	}

	color(): [number, number, number] {
		return [
			this.red.value() % 256,
			this.green.value() % 256,
			this.blue.value() % 256,
		];
	}

	paint(nodeId: string, rgb: [number, number, number]): void {
		this.red.increment(nodeId, rgb[0]);
		this.green.increment(nodeId, rgb[1]);
		this.blue.increment(nodeId, rgb[2]);
	}

	counters(): [GCounter, GCounter, GCounter] {
		return [this.red, this.green, this.blue];
	}

	merge(peerPixel: Pixel): void {
		const peerCounters = peerPixel.counters();
		this.red.merge(peerCounters[0]);
		this.green.merge(peerCounters[1]);
		this.blue.merge(peerCounters[2]);
	}
}
