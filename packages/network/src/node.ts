import {
	type GossipsubEvents,
	type GossipsubMessage,
	gossipsub,
} from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { autoNAT } from "@libp2p/autonat";
import { bootstrap } from "@libp2p/bootstrap";
import {
	circuitRelayServer,
	circuitRelayTransport,
} from "@libp2p/circuit-relay-v2";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { dcutr } from "@libp2p/dcutr";
import { devToolsMetrics } from "@libp2p/devtools-metrics";
import { identify } from "@libp2p/identify";
import type { Ed25519PeerId, PeerId, PeerInfo, PrivateKey, RSAPeerId, Secp256k1PeerId, URLPeerId } from "@libp2p/interface";
import {
	type EventCallback,
	EventHandler,
	type PubSub,
	type Stream,
	type StreamHandler,
} from "@libp2p/interface";
import { createFromPrivKey } from "@libp2p/peer-id-factory";
import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";
import { webRTC, webRTCDirect } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import { webTransport } from "@libp2p/webtransport";
import { multiaddr } from "@multiformats/multiaddr";
import * as lp from "it-length-prefixed";
import { type Libp2p, createLibp2p } from "libp2p";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { Message } from "./proto/messages_pb.js";
import { uint8ArrayToStream } from "./stream.js";
import { KadDHT, kadDHT, ValueEvent } from "@libp2p/kad-dht";
import { peerIdFromString } from "@libp2p/peer-id";
import { fromString as uint8FromString } from 'uint8arrays/from-string';
import { toString as uint8ToString } from "uint8arrays";
import last from "it-last";

export * from "./stream.js";

// snake_casing to match the JSON config
export interface TopologyNetworkNodeConfig {
	addresses?: string[];
	bootstrap?: boolean;
	bootstrap_peers?: string[];
	private_key_seed?: string;
}

export class TopologyNetworkNode {
	private _config?: TopologyNetworkNodeConfig;
	private _node?: Libp2p;
	private _pubsub?: PubSub<GossipsubEvents>;
	private _dht?: KadDHT;

	peerId = "";

	constructor(config?: TopologyNetworkNodeConfig) {
		this._config = config;
	}

	async start() {
		let privateKey: PrivateKey | undefined = undefined;
		if (this._config?.private_key_seed) {
			const tmp = this._config.private_key_seed.padEnd(32, "0");
			privateKey = await generateKeyPairFromSeed(
				"Ed25519",
				uint8ArrayFromString(tmp),
			);
		}

		this._node = await createLibp2p({
			peerId: privateKey ? await createFromPrivKey(privateKey) : undefined,
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
				pubsub: gossipsub({ 
					allowPublishToZeroTopicPeers: true,
				}),
				dht : kadDHT({

				})
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

		this._pubsub = this._node.services.pubsub as PubSub<GossipsubEvents>;
		this.peerId = this._node.peerId.toString();
		this._dht = this._node.services.dht as KadDHT;

		console.log(
			"topology::network::start: Successfuly started topology network w/ peer_id",
			this.peerId,
		);

		this._node.addEventListener("peer:connect", (e) =>
			console.log("::start::peer::connect", e.detail),
		);
		this._node.addEventListener("peer:discovery", (e) =>
			console.log("::start::peer::discovery", e.detail),
		);
		this._node.addEventListener("peer:identify", (e) =>
			console.log("::start::peer::identify", e.detail),
		);
	}

	subscribe(topic: string) {
		if (!this._node) {
			console.error(
				"topology::network::subscribe: Node not initialized, please run .start()",
			);
			return;
		}

		try {
			this._pubsub?.subscribe(topic);
			this._pubsub?.getPeers();
			this.anouncePeerOnDHT(topic, this._node.peerId);

			console.log(
				"topology::network::subscribe: Successfuly subscribed the topic",
				topic,
			);
		} catch (e) {
			console.error("topology::network::subscribe:", e);
		}
	}

	unsubscribe(topic: string) {
		if (!this._node) {
			console.error(
				"topology::network::unsubscribe: Node not initialized, please run .start()",
			);
			return;
		}

		try {
			this._pubsub?.unsubscribe(topic);
			this.removePeerFromDHT(topic, this._node.peerId);
			
			console.log(
				"topology::network::unsubscribe: Successfuly unsubscribed the topic",
				topic,
			);
		} catch (e) {
			console.error("topology::network::unsubscribe:", e);
		}
	}

	getAllPeers() {
		const peers = this._node?.getPeers();
		if (!peers) return [];
		return peers.map((peer) => peer.toString());
	}

	getGroupPeers(group: string) {
		const peers = this._pubsub?.getSubscribers(group);
		if (!peers) return [];
		return peers.map((peer) => peer.toString());
	}

	async broadcastMessage(topic: string, message: Message) {
		try {
			const messageBuffer = Message.encode(message).finish();
			await this._pubsub?.publish(topic, messageBuffer);

			console.log(
				"topology::network::broadcastMessage: Successfuly broadcasted message to topic",
				topic,
			);
		} catch (e) {
			console.error("topology::network::broadcastMessage:", e);
		}
	}

	async sendMessage(peerId: string, protocols: string[], message: Message) {
		try {
			const connection = await this._node?.dial([multiaddr(`/p2p/${peerId}`)]);
			const stream = <Stream>await connection?.newStream(protocols);
			const messageBuffer = Message.encode(message).finish();
			uint8ArrayToStream(stream, messageBuffer);
		} catch (e) {
			console.error("topology::network::sendMessage:", e);
		}
	}

	async sendGroupMessageRandomPeer(
		group: string,
		protocols: string[],
		message: Message,
	) {
		try {
			const peers = this._pubsub?.getSubscribers(group);
			if (!peers || peers.length === 0) throw Error("Topic wo/ peers");
			const peerId = peers[Math.floor(Math.random() * peers.length)];

			const connection = await this._node?.dial(peerId);
			const stream: Stream = (await connection?.newStream(protocols)) as Stream;
			const messageBuffer = Message.encode(message).finish();
			uint8ArrayToStream(stream, messageBuffer);
		} catch (e) {
			console.error("topology::network::sendMessageRandomTopicPeer:", e);
		}
	}

	addGroupMessageHandler(
		group: string,
		handler: EventCallback<CustomEvent<GossipsubMessage>>,
	) {
		this._pubsub?.addEventListener("gossipsub:message", (e) => {
			if (group && e.detail.msg.topic !== group) return;
			handler(e);
		});
	}

	addMessageHandler(protocol: string | string[], handler: StreamHandler) {
		this._node?.handle(protocol, handler);
	}

	/**
	 * 
	 * @param key  The key to search for
	 * @param value  The value to search for
	 * @returns The value `true` if the data was put on the DHT successfully, `false` if not and undefined if the DHT is not initialized
	 */
	async putDataOnDHT(key : Uint8Array, value : Uint8Array) : Promise<boolean | undefined>{
		if (!this._dht) {
			console.error("DHT not initialized. Please run .start()");
			return undefined;
		}

		try {
			await this._dht?.put(key, value);
			console.log("Successfully stored data in DHT");
			return true;
		}catch (e){
			console.error("Error storing data in DHT : ", e);
			return false;
		}
	}

	/**
	 * 
	 * @param key The key to search for
	 * @returns The value if the data was found, undefined if the data was not found or the DHT is not initialized
	 */
	async getDataFromDHT(key : Uint8Array) : Promise<Uint8Array | undefined>{
		if (!this._dht) {
			console.error("DHT not initialized. Please run .start()");
			return undefined;
		}

		try {
			const data = await this._dht.get(key);
			for await (const event of data){
				if (event.name == "VALUE"){
					return event.value;
				}
			}
		}catch (e){
			console.error("Error retrieving data from DHT : ", e);
		}
	}

	async anouncePeerOnDHT(topic : string, peer_id : PeerId){
		let peersSet = await this.getPeersOnTopicFromDHT(topic);
		peersSet.add(peer_id);
		let newPeers = JSON.stringify(Array.from(peersSet));
		let newPeersUint8 = uint8FromString(newPeers);	
		let uint8Topic = uint8ArrayFromString(topic);
		await this.putDataOnDHT(uint8Topic, newPeersUint8);	
	}

	async removePeerFromDHT(topic : string, peerId : PeerId){
		let peersSet = await this.getPeersOnTopicFromDHT(topic);
		peersSet.delete(peerId);
		let newPeers = JSON.stringify(Array.from(peersSet));
		let newPeersUint8 = uint8FromString(newPeers);	
		let uint8Topic = uint8ArrayFromString(topic);
		await this.putDataOnDHT(uint8Topic, newPeersUint8);
	}

	async getPeersOnTopicFromDHT(topic : string) : Promise<Set<PeerId>>{
		let uint8Topic = uint8ArrayFromString(topic);
		let peersOnTopic = await this._dht?.get(uint8Topic);
		let peersSet = new Set<PeerId>();
		if( peersOnTopic ){
			let lastResult = await last(peersOnTopic) as ValueEvent;
			if(lastResult){
				let uint8Peers = lastResult.value;
				let peersArray = JSON.parse(uint8ToString(uint8Peers));
				peersSet = new Set(peersArray);		
			}
		}
		return peersSet;
	}
}
