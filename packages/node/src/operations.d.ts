import { type TopologyObject } from "@topology-foundation/object";
import type { TopologyNode } from "./index.js";
export declare function createObject(node: TopologyNode, object: TopologyObject): void;
export declare function subscribeObject(node: TopologyNode, objectId: string): Promise<void>;
export declare function unsubscribeObject(node: TopologyNode, objectId: string, purge?: boolean): void;
export declare function syncObject(node: TopologyNode, objectId: string, peerId?: string): Promise<void>;
//# sourceMappingURL=operations.d.ts.map