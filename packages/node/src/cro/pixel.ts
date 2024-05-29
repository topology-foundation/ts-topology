import { GCounter } from "@topologygg/crdt";

export class Pixel {
  private _red: GCounter;
  private _green: GCounter;
  private _blue: GCounter;

  constructor() {
    this._red = new GCounter({});
    this._green = new GCounter({});
    this._blue = new GCounter({});
  }

  color(): [number, number, number] {
    return [
      this._red.value() % 255,
      this._green.value() % 255,
      this._blue.value() % 255,
    ];
  }

  paint(node_id: string, rgb: [number, number, number]): void {
    this._red.increment(node_id, rgb[0]);
    this._green.increment(node_id, rgb[1]);
    this._blue.increment(node_id, rgb[2]);
  }

  counters(): [GCounter, GCounter, GCounter] {
    return [this._red, this._green, this._blue];
  }

  merge(peer_pixel: Pixel): void {
    let peer_counters = peer_pixel.counters();
    this._red.merge(peer_counters[0]);
    this._green.merge(peer_counters[1]);
    this._blue.merge(peer_counters[2]);
  }
}
