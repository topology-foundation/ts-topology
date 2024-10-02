import { gossipsub, } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { autoNAT } from "@libp2p/autonat";
import { bootstrap } from "@libp2p/bootstrap";
import { circuitRelayServer, circuitRelayTransport, } from "@libp2p/circuit-relay-v2";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { dcutr } from "@libp2p/dcutr";
import { devToolsMetrics } from "@libp2p/devtools-metrics";
import { identify } from "@libp2p/identify";
import { kadDHT } from "@libp2p/kad-dht";
import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";
import { webRTC, webRTCDirect } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import { webTransport } from "@libp2p/webtransport";
import { multiaddr } from "@multiformats/multiaddr";
import last from "it-last";
import { createLibp2p } from "libp2p";
import { toString as uint8ToString } from "uint8arrays";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { Message } from "./proto/messages_pb.js";
import { uint8ArrayToStream } from "./stream.js";
export * from "./stream.js";
export class TopologyNetworkNode {
    _config;
    _node;
    _pubsub;
    _dht;
    peerId = "";
    constructor(config) {
        this._config = config;
    }
    async start() {
        let privateKey = undefined;
        if (this._config?.private_key_seed) {
            const tmp = this._config.private_key_seed.padEnd(32, "0");
            privateKey = await generateKeyPairFromSeed("Ed25519", uint8ArrayFromString(tmp));
        }
        this._node = await createLibp2p({
            privateKey,
            addresses: {
                listen: this._config?.addresses ? this._config.addresses : ["/webrtc"],
            },
            connectionEncryption: [noise()],
            connectionGater: {
                denyDialMultiaddr: () => {
                    return false;
                },
            },
            metrics: devToolsMetrics(),
            peerDiscovery: [
                pubsubPeerDiscovery({
                    interval: 10_000,
                    topics: ["topology::discovery"],
                }),
                bootstrap({
                    list: this._config?.bootstrap_peers
                        ? this._config.bootstrap_peers
                        : [
                            "/dns4/relay.droak.sh/tcp/443/wss/p2p/Qma3GsJmB47xYuyahPZPSadh1avvxfyYQwk8R3UnFrQ6aP",
                        ],
                }),
            ],
            services: {
                autonat: autoNAT(),
                dcutr: dcutr(),
                identify: identify(),
                dht: kadDHT(),
                pubsub: gossipsub(),
            },
            streamMuxers: [yamux()],
            transports: [
                circuitRelayTransport({
                    discoverRelays: 2,
                    reservationConcurrency: 1,
                }),
                webRTC(),
                webRTCDirect(),
                webSockets(),
                webTransport(),
            ],
        });
        if (this._config?.bootstrap)
            this._node.services.relay = circuitRelayServer();
        if (!this._config?.bootstrap) {
            for (const addr of this._config?.bootstrap_peers || []) {
                this._node.dial(multiaddr(addr));
            }
        }
        this._pubsub = this._node.services.pubsub;
        this.peerId = this._node.peerId.toString();
        this._dht = this._node.services.dht;
        console.log("topology::network::start: Successfuly started topology network w/ peer_id", this.peerId);
        this._node.addEventListener("peer:connect", (e) => console.log("::start::peer::connect", e.detail));
        this._node.addEventListener("peer:discovery", (e) => console.log("::start::peer::discovery", e.detail));
        this._node.addEventListener("peer:identify", (e) => console.log("::start::peer::identify", e.detail));
    }
    async subscribe(topic) {
        if (!this._node) {
            console.error("topology::network::subscribe: Node not initialized, please run .start()");
            return;
        }
        try {
            this._pubsub?.subscribe(topic);
            this._pubsub?.getPeers();
            this.anouncePeerOnDHT(topic, this._node.peerId);
            // connect to all peers on the topic
            const peers = await this.getPeersOnTopicFromDHT(topic);
            for (const peerId of peers) {
                await this._node.dial(peerId);
            }
            console.log("topology::network::subscribe: Successfuly subscribed the topic", topic);
        }
        catch (e) {
            console.error("topology::network::subscribe:", e);
        }
    }
    unsubscribe(topic) {
        if (!this._node) {
            console.error("topology::network::unsubscribe: Node not initialized, please run .start()");
            return;
        }
        try {
            this._pubsub?.unsubscribe(topic);
            this.removePeerFromDHT(topic, this._node.peerId);
            console.log("topology::network::unsubscribe: Successfuly unsubscribed the topic", topic);
        }
        catch (e) {
            console.error("topology::network::unsubscribe:", e);
        }
    }
    getAllPeers() {
        const peers = this._node?.getPeers();
        if (!peers)
            return [];
        return peers.map((peer) => peer.toString());
    }
    getGroupPeers(group) {
        const peers = this._pubsub?.getSubscribers(group);
        if (!peers)
            return [];
        return peers.map((peer) => peer.toString());
    }
    async broadcastMessage(topic, message) {
        try {
            const messageBuffer = Message.encode(message).finish();
            await this._pubsub?.publish(topic, messageBuffer);
            console.log("topology::network::broadcastMessage: Successfuly broadcasted message to topic", topic);
        }
        catch (e) {
            console.error("topology::network::broadcastMessage:", e);
        }
    }
    async sendMessage(peerId, protocols, message) {
        try {
            const connection = await this._node?.dial([multiaddr(`/p2p/${peerId}`)]);
            const stream = await connection?.newStream(protocols);
            const messageBuffer = Message.encode(message).finish();
            uint8ArrayToStream(stream, messageBuffer);
        }
        catch (e) {
            console.error("topology::network::sendMessage:", e);
        }
    }
    async sendGroupMessageRandomPeer(group, protocols, message) {
        try {
            const peers = this._pubsub?.getSubscribers(group);
            if (!peers || peers.length === 0)
                throw Error("Topic wo/ peers");
            const peerId = peers[Math.floor(Math.random() * peers.length)];
            const connection = await this._node?.dial(peerId);
            const stream = (await connection?.newStream(protocols));
            const messageBuffer = Message.encode(message).finish();
            uint8ArrayToStream(stream, messageBuffer);
        }
        catch (e) {
            console.error("topology::network::sendMessageRandomTopicPeer:", e);
        }
    }
    addGroupMessageHandler(group, handler) {
        this._pubsub?.addEventListener("gossipsub:message", (e) => {
            if (group && e.detail.msg.topic !== group)
                return;
            handler(e);
        });
    }
    addMessageHandler(protocol, handler) {
        this._node?.handle(protocol, handler);
    }
    /**
     *
     * @param key  The key to search for
     * @param value  The value to search for
     * @returns The value `true` if the data was put on the DHT successfully, `false` if not and undefined if the DHT is not initialized
     */
    async putDataOnDHT(key, value) {
        if (!this._dht) {
            console.error("DHT not initialized. Please run .start()");
            return undefined;
        }
        try {
            await this._dht?.put(key, value);
            console.log("Successfully stored data in DHT");
            return true;
        }
        catch (e) {
            console.error("Error storing data in DHT : ", e);
            return false;
        }
    }
    /**
     *
     * @param key The key to search for
     * @returns The value if the data was found, undefined if the data was not found or the DHT is not initialized
     */
    async getDataFromDHT(key) {
        if (!this._dht) {
            console.error("DHT not initialized. Please run .start()");
            return undefined;
        }
        try {
            const data = await this._dht.get(key);
            for await (const event of data) {
                if (event.name === "VALUE") {
                    return event.value;
                }
            }
        }
        catch (e) {
            console.error("Error retrieving data from DHT : ", e);
        }
    }
    /*
     * Anounce the peer on the DHT
     * @param topic The topic to anounce the peer on
     * @param peer_id The peer to anounce
     * @returns nothing
     * */
    async anouncePeerOnDHT(topic, peer_id) {
        const peersSet = await this.getPeersOnTopicFromDHT(topic);
        peersSet.add(peer_id);
        const newPeers = JSON.stringify(Array.from(peersSet));
        const newPeersUint8 = uint8ArrayFromString(newPeers);
        const uint8Topic = uint8ArrayFromString(topic);
        await this.putDataOnDHT(uint8Topic, newPeersUint8);
    }
    /*
     * Remove the peer from the DHT
     * @param topic The topic to remove the peer from
     * @param peer_id The peer to remove
     * @returns nothing
     * */
    async removePeerFromDHT(topic, peerId) {
        const peersSet = await this.getPeersOnTopicFromDHT(topic);
        peersSet.delete(peerId);
        const newPeers = JSON.stringify(Array.from(peersSet));
        const newPeersUint8 = uint8ArrayFromString(newPeers);
        const uint8Topic = uint8ArrayFromString(topic);
        await this.putDataOnDHT(uint8Topic, newPeersUint8);
    }
    /*
     * Get the peers on a topic from the DHT
     * @param topic The topic to get the peers from
     * @returns A set of PeerId
     * */
    async getPeersOnTopicFromDHT(topic) {
        const uint8Topic = uint8ArrayFromString(topic);
        const peersOnTopic = await this._dht?.get(uint8Topic);
        let peersSet = new Set();
        if (peersOnTopic) {
            const lastResult = (await last(peersOnTopic));
            if (lastResult) {
                const uint8Peers = lastResult.value;
                const peersArray = JSON.parse(uint8ToString(uint8Peers));
                peersSet = new Set(peersArray);
            }
        }
        return peersSet;
    }
}
