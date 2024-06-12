import { GCounter, IGCounter } from "@topology-foundation/crdt";
import { TopologyObject } from "@topology-foundation/object";

export interface IPixel {
  red: IGCounter;
  green: IGCounter;
  blue: IGCounter;
  color(): [number, number, number];
  paint(nodeId: string, rgb: [number, number, number]): void;
  counters(): [IGCounter, IGCounter, IGCounter];
  merge(peerPixel: IPixel): void;
}

export class Pixel extends TopologyObject implements IPixel {
  red: IGCounter;
  green: IGCounter;
  blue: IGCounter;

  constructor(peerId: string) {
    super(peerId);
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

  counters(): [IGCounter, IGCounter, IGCounter] {
    return [this.red, this.green, this.blue];
  }

  merge(peerPixel: Pixel): void {
    let peerCounters = peerPixel.counters();
    this.red.merge(peerCounters[0]);
    this.green.merge(peerCounters[1]);
    this.blue.merge(peerCounters[2]);
  }
}
