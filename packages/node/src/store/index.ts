import { TopologyObject } from "@topology-foundation/object";

export class TopologyObjectStore {
  // TODO: should be abstracted in handling multiple types of storage
  private _store: Map<string, TopologyObject>;

  constructor() {
    this._store = new Map<string, TopologyObject>();
  }

  get(objectId: string): TopologyObject | undefined {
    return this._store.get(objectId);
  }

  put(objectId: string, object: TopologyObject) {
    this._store.set(objectId, object);
  }
}
