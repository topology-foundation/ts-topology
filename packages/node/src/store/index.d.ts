import type { TopologyObject } from "@topology-foundation/object";
export type TopologyObjectStoreCallback = (objectId: string, object: TopologyObject) => void;
export declare class TopologyObjectStore {
    private _store;
    private _subscriptions;
    constructor();
    get(objectId: string): TopologyObject | undefined;
    put(objectId: string, object: TopologyObject): void;
    subscribe(objectId: string, callback: TopologyObjectStoreCallback): void;
    private _notifySubscribers;
    remove(objectId: string): void;
}
//# sourceMappingURL=index.d.ts.map