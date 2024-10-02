import { type GossipsubMessage } from "@chainsafe/libp2p-gossipsub";
import type { EventCallback, PeerId, StreamHandler } from "@libp2p/interface";
import { Message } from "./proto/messages_pb.js";
export * from "./stream.js";
export interface TopologyNetworkNodeConfig {
    addresses?: string[];
    bootstrap?: boolean;
    bootstrap_peers?: string[];
    private_key_seed?: string;
}
export declare class TopologyNetworkNode {
    private _config?;
    private _node?;
    private _pubsub?;
    private _dht?;
    peerId: string;
    constructor(config?: TopologyNetworkNodeConfig);
    start(): Promise<void>;
    subscribe(topic: string): Promise<void>;
    unsubscribe(topic: string): void;
    getAllPeers(): string[];
    getGroupPeers(group: string): string[];
    broadcastMessage(topic: string, message: Message): Promise<void>;
    sendMessage(peerId: string, protocols: string[], message: Message): Promise<void>;
    sendGroupMessageRandomPeer(group: string, protocols: string[], message: Message): Promise<void>;
    addGroupMessageHandler(group: string, handler: EventCallback<CustomEvent<GossipsubMessage>>): void;
    addMessageHandler(protocol: string | string[], handler: StreamHandler): void;
    /**
     *
     * @param key  The key to search for
     * @param value  The value to search for
     * @returns The value `true` if the data was put on the DHT successfully, `false` if not and undefined if the DHT is not initialized
     */
    putDataOnDHT(key: Uint8Array, value: Uint8Array): Promise<boolean | undefined>;
    /**
     *
     * @param key The key to search for
     * @returns The value if the data was found, undefined if the data was not found or the DHT is not initialized
     */
    getDataFromDHT(key: Uint8Array): Promise<Uint8Array | undefined>;
    anouncePeerOnDHT(topic: string, peer_id: PeerId): Promise<void>;
    removePeerFromDHT(topic: string, peerId: PeerId): Promise<void>;
    getPeersOnTopicFromDHT(topic: string): Promise<Set<PeerId>>;
}
//# sourceMappingURL=node.d.ts.map