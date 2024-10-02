import type { GossipsubMessage } from "@chainsafe/libp2p-gossipsub";
import type { EventCallback, StreamHandler } from "@libp2p/interface";
import { TopologyNetworkNode, type TopologyNetworkNodeConfig } from "@topology-foundation/network";
import { type CRO, TopologyObject } from "@topology-foundation/object";
import { TopologyObjectStore } from "./store/index.js";
export interface TopologyNodeConfig {
    network_config?: TopologyNetworkNodeConfig;
}
export declare class TopologyNode {
    config?: TopologyNodeConfig;
    objectStore: TopologyObjectStore;
    networkNode: TopologyNetworkNode;
    constructor(config?: TopologyNodeConfig);
    start(): Promise<void>;
    addCustomGroup(group: string): void;
    addCustomGroupMessageHandler(group: string, handler: EventCallback<CustomEvent<GossipsubMessage>>): void;
    sendGroupMessage(group: string, data: Uint8Array): void;
    addCustomMessageHandler(protocol: string | string[], handler: StreamHandler): void;
    sendCustomMessage(peerId: string, protocol: string, data: Uint8Array): void;
    createObject(cro: CRO, id?: string, abi?: string, sync?: boolean, peerId?: string): Promise<TopologyObject>;
    subscribeObject(id: string): Promise<void>;
    unsubscribeObject(id: string, purge?: boolean): void;
    syncObject(id: string, peerId?: string): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map