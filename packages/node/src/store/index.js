export class TopologyObjectStore {
    // TODO: should be abstracted in handling multiple types of storage
    _store;
    _subscriptions;
    constructor() {
        this._store = new Map();
        this._subscriptions = new Map();
    }
    get(objectId) {
        return this._store.get(objectId);
    }
    put(objectId, object) {
        this._store.set(objectId, object);
        this._notifySubscribers(objectId, object);
    }
    subscribe(objectId, callback) {
        if (!this._subscriptions.has(objectId)) {
            this._subscriptions.set(objectId, []);
        }
        this._subscriptions.get(objectId)?.push(callback);
    }
    _notifySubscribers(objectId, object) {
        const callbacks = this._subscriptions.get(objectId);
        if (callbacks) {
            for (const callback of callbacks) {
                callback(objectId, object);
            }
        }
    }
    remove(objectId) {
        this._store.delete(objectId);
    }
}
