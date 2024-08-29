import type { TopologyObjectBase } from "@topology-foundation/object";

export type TopologyObjectStoreCallback = (
	objectId: string,
	object: TopologyObjectBase,
) => void;

export class TopologyObjectStore {
	// TODO: should be abstracted in handling multiple types of storage
	private _store: Map<string, TopologyObjectBase>;
	private _subscriptions: Map<string, TopologyObjectStoreCallback[]>;

	constructor() {
		this._store = new Map<string, TopologyObjectBase>();
		this._subscriptions = new Map<string, TopologyObjectStoreCallback[]>();
	}

	get(objectId: string): TopologyObjectBase | undefined {
		return this._store.get(objectId);
	}

	put(objectId: string, object: TopologyObjectBase) {
		this._store.set(objectId, object);
		this._notifySubscribers(objectId, object);
	}

	subscribe(objectId: string, callback: TopologyObjectStoreCallback): void {
		if (!this._subscriptions.has(objectId)) {
			this._subscriptions.set(objectId, []);
		}
		this._subscriptions.get(objectId)?.push(callback);
	}

	private _notifySubscribers(
		objectId: string,
		object: TopologyObjectBase,
	): void {
		const callbacks = this._subscriptions.get(objectId);
		if (callbacks) {
			for (const callback of callbacks) {
				callback(objectId, object);
			}
		}
	}

	remove(objectId: string) {
		this._store.delete(objectId);
	}
}
