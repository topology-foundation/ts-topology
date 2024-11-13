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
	PeerId,
	PubSub,
	Stream,
	StreamHandler,
} from "@libp2p/interface";
import { kadDHT, removePrivateAddressesMapper, removePublicAddressesMapper } from "@libp2p/kad-dht";
import { webRTC, webRTCDirect } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import * as filters from "@libp2p/websockets/filters";
import { webTransport } from "@libp2p/webtransport";
import { multiaddr } from "@multiformats/multiaddr";
import { Logger, type LoggerOptions } from "@topology-foundation/logger";
import { type Libp2p, createLibp2p } from "libp2p";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { Message } from "./proto/topology/network/messages_pb.js";
import { uint8ArrayToStream } from "./stream.js";

export * from "./stream.js";

let log: Logger;
type PeerConnectionCallback = (peerId: CustomEvent<PeerId>) => void;

// snake_casing to match the JSON config
export interface TopologyNetworkNodeConfig {
	addresses?: string[];
	bootstrap?: boolean;
	bootstrap_peers?: string[];
	browser_metrics?: boolean;
	private_key_seed?: string;
	log_config?: LoggerOptions;
	onPeerConnect?: PeerConnectionCallback;
    onPeerDisconnect?: PeerConnectionCallback;
}

export class TopologyNetworkNode {
	private _config?: TopologyNetworkNodeConfig;
	private _node?: Libp2p;
	private _pubsub?: PubSub<GossipsubEvents>;

	peerId = "";

	constructor(config?: TopologyNetworkNodeConfig) {
		this._config = config;
		log = new Logger("topology::network", config?.log_config);
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
					"/dns4/bootstrap1.topology.gg/tcp/443/wss/p2p/12D3KooWBu1pZ3v2u6tXSmkN35kiMLENpv3bEXcyT1GJTVhipAkG",
					"/dns4/bootstrap2.topology.gg/tcp/443/wss/p2p/12D3KooWLGuTtCHLpd1SBHeyvzT3kHVe2dw8P7UdoXsfQHu8qvkf",
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
			// dht: kadDHT({
			// 	protocol: "/topology/dht/1.0.0",
			// 	kBucketSize: this._config?.bootstrap ? 40 : 20,
			// 	clientMode: false,
			// 	peerInfoMapper: removePublicAddressesMapper,
			// 	querySelfInterval: 20000,
			// 	initialQuerySelfInterval: 10000,
			// 	allowQueryWithZeroPeers: false,
			// }),
			dht: kadDHT({
				protocol: "/topology/lan/dht/1.0.0",
				kBucketSize: this._config?.bootstrap ? 40 : 20,
				clientMode: false,
				peerInfoMapper: removePublicAddressesMapper,
				querySelfInterval: 20000,
				initialQuerySelfInterval: 10000,
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
			streamMuxers: [yamux({
				enableKeepAlive: true,
				keepAliveInterval: 10000,
				maxMessageSize: 4194304,

			})],
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
				// check if not dialing self
				// try {
				this._node.dial(multiaddr(addr));
				// }catch(err){
				// 	console.error("Error dialing bootstrap peer", err);
				// 	process.exit(1);
				// }
			}
		}

		this._pubsub = this._node.services.pubsub as PubSub<GossipsubEvents>;

		this.peerId = this._node.peerId.toString();

		log.info(
			"::start: Successfuly started topology network w/ peer_id",
			this.peerId,
		);

		setInterval(() => {
			const ma = this._node?.getMultiaddrs();
			log.info("::start::multiaddrs", ma);
		}, 5000);

		this._node.addEventListener("peer:connect", async (e) => { });

		this._node.addEventListener("peer:disconnect", async (e) => { });

		this._node.addEventListener("peer:discovery", async (e) => {
			// current bug in v11.0.0 requires manual dial (https://github.com/libp2p/js-libp2p-pubsub-peer-discovery/issues/149)
			const sortedAddrs = e.detail.multiaddrs.sort((a, b) => {
				const localRegex =
					/(^\/ip4\/127\.)|(^\/ip4\/10\.)|(^\/ip4\/172\.1[6-9]\.)|(^\/ip4\/172\.2[0-9]\.)|(^\/ip4\/172\.3[0-1]\.)|(^\/ip4\/192\.168\.)/;
				const aLocal = localRegex.test(a.toString());
				const bLocal = localRegex.test(b.toString());
				const aWebrtc = a.toString().includes("/webrtc/");
				const bWebrtc = b.toString().includes("/webrtc/");
				if (aLocal && !bLocal) return 1;
				if (!aLocal && bLocal) return -1;
				if (aWebrtc && !bWebrtc) return -1;
				if (!aWebrtc && bWebrtc) return 1;
				return 0;
			});

			// Dial non-local multiaddrs, then WebRTC multiaddrs
			for (const address of sortedAddrs) {
				this._node?.dial(address);
			}
<<<<<<< HEAD
=======

			log.info("::start::peer::discovery", e.detail);
>>>>>>> 02a2e65 (feat: add new bootstrap nodes; sort order for dialing discovered ma's (#246))
		});

		this._node.addEventListener("peer:identify", (e) => {
			log.info("::start::peer::identify", e.detail.peerId);
		});
	}

	subscribe(topic: string) {
		if (!this._node) {
			log.error("::subscribe: Node not initialized, please run .start()");
			return;
		}

		try {
			this._pubsub?.subscribe(topic);
			this._pubsub?.getPeers();
			log.info("::subscribe: Successfuly subscribed the topic", topic);
		} catch (e) {
			log.error("::subscribe:", e);
		}
	}

	unsubscribe(topic: string) {
		if (!this._node) {
			log.error("::unsubscribe: Node not initialized, please run .start()");
			return;
		}

		try {
			this._pubsub?.unsubscribe(topic);
			log.info("::unsubscribe: Successfuly unsubscribed the topic", topic);
		} catch (e) {
			log.error("::unsubscribe:", e);
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

			log.info(
				"::broadcastMessage: Successfuly broadcasted message to topic",
				topic,
			);
		} catch (e) {
			log.error("::broadcastMessage:", e);
		}
	}

	async sendMessage(peerId: string, protocols: string[], message: Message) {
		try {
			const connection = await this._node?.dial([multiaddr(`/p2p/${peerId}`)]);
			const stream = <Stream>await connection?.newStream(protocols);
			const messageBuffer = Message.encode(message).finish();
			uint8ArrayToStream(stream, messageBuffer);
		} catch (e) {
			log.error("::sendMessage:", e);
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
			log.error("::sendMessageRandomTopicPeer:", e);
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
	 * This function allows to check if the node is ready to be used on the network
	 * We check if the node has any multiaddrs as for /webrtc it takes a while to get them assigned from the relay server node.
	 * @returns boolean
	 */
	checkNodeReady(): boolean {
		if (this._node?.getMultiaddrs().length) {
			return true;
		}
		return false;
	}

	getNode(): Libp2p | undefined {
		return this._node;
	}
}
