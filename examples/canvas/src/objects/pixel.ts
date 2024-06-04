import { GCounter } from "@topologygg/crdt";
import { TopologyObject } from "@topologygg/object";

export class Pixel extends TopologyObject {
  private _red: GCounter;
  private _green: GCounter;
  private _blue: GCounter;

  constructor() {
    super("");
    this._red = new GCounter({});
    this._green = new GCounter({});
    this._blue = new GCounter({});
  }

  color(): [number, number, number] {
    return [
      this._red.value() % 256,
      this._green.value() % 256,
      this._blue.value() % 256,
    ];
  }

  paint(nodeId: string, rgb: [number, number, number]): void {
    this._red.increment(nodeId, rgb[0]);
    this._green.increment(nodeId, rgb[1]);
    this._blue.increment(nodeId, rgb[2]);
  }

  counters(): [GCounter, GCounter, GCounter] {
    return [this._red, this._green, this._blue];
  }

  merge(peerPixel: Pixel): void {
    let peerCounters = peerPixel.counters();
    this._red.merge(peerCounters[0]);
    this._green.merge(peerCounters[1]);
    this._blue.merge(peerCounters[2]);
  }
}
