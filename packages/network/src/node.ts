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
import type {
	EventCallback,
	PubSub,
	Stream,
	StreamHandler,
} from "@libp2p/interface";
import {
	type KadDHT,
	kadDHT,
	removePrivateAddressesMapper,
	removePublicAddressesMapper,
} from "@libp2p/kad-dht";
import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";
import { webRTC, webRTCDirect } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import * as filters from "@libp2p/websockets/filters";
import { webTransport } from "@libp2p/webtransport";
import { multiaddr } from "@multiformats/multiaddr";
import { type Libp2p, createLibp2p } from "libp2p";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { Message } from "./proto/messages_pb.js";
import { uint8ArrayToStream } from "./stream.js";

export * from "./stream.js";

// snake_casing to match the JSON config
export interface TopologyNetworkNodeConfig {
	addresses?: string[];
	bootstrap?: boolean;
	bootstrap_peers?: string[];
	browser_metrics?: boolean;
	private_key_seed?: string;
}

export class TopologyNetworkNode {
	private _config?: TopologyNetworkNodeConfig;
	private _node?: Libp2p;
	private _pubsub?: PubSub<GossipsubEvents>;

	peerId = "";

	constructor(config?: TopologyNetworkNodeConfig) {
		this._config = config;
	}

	async start() {
		let privateKey = undefined;
		if (this._config?.private_key_seed) {
			const tmp = this._config.private_key_seed.padEnd(32, "0");
			privateKey = await generateKeyPairFromSeed(
				"Ed25519",
				uint8ArrayFromString(tmp),
			);
		}

		const _bootstrapNodesList = this._config?.bootstrap_peers
			? this._config.bootstrap_peers
			: [
					// "/dns4/relay.droak.sh/tcp/443/wss/p2p/Qma3GsJmB47xYuyahPZPSadh1avvxfyYQwk8R3UnFrQ6aP",
					// "/ip4/127.0.0.1/tcp/50000/ws/p2p/12D3KooWC6sm9iwmYbeQJCJipKTRghmABNz1wnpJANvSMabvecwJ",
					"/dns4/topology-1.nfinic.com/tcp/4430/wss/p2p/12D3KooWC6sm9iwmYbeQJCJipKTRghmABNz1wnpJANvSMabvecwJ",
				];

		const _peerDiscovery = _bootstrapNodesList.length
			? [
					bootstrap({
						list: _bootstrapNodesList,
					}),
				]
			: [];

		const _node_services = {
			autonat: autoNAT(),
			dcutr: dcutr(),
			identify: identify(),
			pubsub: gossipsub(),
			dht: kadDHT({
				protocol: "/topology/dht/1.0.0",
				kBucketSize: 20,
				clientMode: false,
				peerInfoMapper: removePublicAddressesMapper,
				querySelfInterval: 10_000,
				initialQuerySelfInterval: 20_000,
				allowQueryWithZeroPeers: false,
			}),
		};

		const _bootstrap_node_services = {
			..._node_services,
			relay: circuitRelayServer(),
		};

		this._node = await createLibp2p({
			privateKey,
			addresses: {
				listen: this._config?.addresses ? this._config.addresses : ["/webrtc"],
			},
			connectionEncrypters: [noise()],
			connectionGater: {
				denyDialMultiaddr: () => {
					return false;
				},
			},
			metrics: this._config?.browser_metrics ? devToolsMetrics() : undefined,
			peerDiscovery: _peerDiscovery,
			services: this._config?.bootstrap
				? _bootstrap_node_services
				: _node_services,
			streamMuxers: [yamux()],
			transports: [
				circuitRelayTransport({
					discoverRelays: 2,
					reservationConcurrency: 1,
				}),
				webRTC(),
				webRTCDirect(),
				webSockets({
					filter: filters.all,
				}),
				webTransport(),
			],
		});

		if (!this._config?.bootstrap) {
			for (const addr of this._config?.bootstrap_peers || []) {
				const stream = await this._node.dial(multiaddr(addr));
			}
		}

		this._pubsub = this._node.services.pubsub as PubSub<GossipsubEvents>;

		this.peerId = this._node.peerId.toString();

		console.log(
			"topology::network::start: Successfuly started topology network w/ peer_id",
			this.peerId,
		);

		this._node.addEventListener("peer:connect", async (e) => {
			console.log("::start::peer::connect", e.detail);
		});

		this._node.addEventListener("peer:discovery", async (e) => {
			// current bug in v11.0.0 requires manual dial (https://github.com/libp2p/js-libp2p-pubsub-peer-discovery/issues/149)
			for (const ma of e.detail.multiaddrs) {
				this._node?.dial(ma);
			}
			console.log("::start::peer::discovery", e.detail.id);
		});

		this._node.addEventListener("peer:identify", (e) => {
			console.log("::start::peer::identify", e.detail.peerId);
		});
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
}
