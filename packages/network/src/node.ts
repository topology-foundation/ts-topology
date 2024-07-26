import {
  GossipsubEvents,
  GossipsubMessage,
  gossipsub,
} from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import {
  circuitRelayServer,
  circuitRelayTransport,
} from "@libp2p/circuit-relay-v2";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { dcutr } from "@libp2p/dcutr";
import { identify } from "@libp2p/identify";
import { EventHandler, PubSub, Stream, StreamHandler } from "@libp2p/interface";
import { createFromPrivKey } from "@libp2p/peer-id-factory";
import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";
import { webRTC, webRTCDirect } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import { multiaddr } from "@multiformats/multiaddr";
import { Libp2p, createLibp2p } from "libp2p";
import { stringToStream } from "./stream.js";
import { bootstrap } from "@libp2p/bootstrap";
import { webTransport } from "@libp2p/webtransport";
import { autoNAT } from "@libp2p/autonat";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";

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

  peerId: string = "";

  constructor(config?: TopologyNetworkNodeConfig) {
    this._config = config;
  }

  async start() {
    let privateKey;
    if (this._config?.private_key_seed) {
      let tmp = this._config.private_key_seed.padEnd(32, "0");
      privateKey = await generateKeyPairFromSeed(
        "Ed25519",
        uint8ArrayFromString(tmp),
      );
    }

    this._node = await createLibp2p({
      peerId: privateKey ? await createFromPrivKey(privateKey) : undefined,
      addresses: {
        listen:
          this._config && this._config.addresses
            ? this._config.addresses
            : ["/webrtc"],
      },
      connectionEncryption: [noise()],
      connectionGater: {
        denyDialMultiaddr: () => {
          return false;
        },
      },
      peerDiscovery: [
        pubsubPeerDiscovery({
          interval: 10_000,
          topics: ["topology::discovery"],
        }),
        bootstrap({
          list:
            this._config && this._config.bootstrap_peers
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

    console.log(
      "topology::network::start: Successfuly started topology network w/ peer_id",
      this.peerId,
    );

    // TODO remove this or add better logger
    // we need to keep it now for debugging
    this._node.addEventListener("peer:connect", (e) =>
      console.log("peer:connect", e.detail),
    );
    this._node.addEventListener("peer:discovery", (e) =>
      console.log("peer:discovery", e.detail),
    );
    this._node.addEventListener("peer:identify", (e) =>
      console.log("peer:identify", e.detail),
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

  async broadcastMessage(topic: string, message: Uint8Array) {
    try {
      if (this._pubsub?.getSubscribers(topic)?.length === 0) return;
      await this._pubsub?.publish(topic, message);

      console.log(
        "topology::network::broadcastMessage: Successfuly broadcasted message to topic",
        topic,
      );
    } catch (e) {
      console.error("topology::network::broadcastMessage:", e);
    }
  }

  async sendMessage(peerId: string, protocols: string[], message: string) {
    try {
      const connection = await this._node?.dial([multiaddr(`/p2p/${peerId}`)]);
      const stream = <Stream>await connection?.newStream(protocols);
      stringToStream(stream, message);

      console.log(
        `topology::network::sendMessage: Successfuly sent message to peer: ${peerId} with message: ${message}`,
      );
    } catch (e) {
      console.error("topology::network::sendMessage:", e);
    }
  }

  async sendGroupMessageRandomPeer(
    group: string,
    protocols: string[],
    message: string,
  ) {
    try {
      const peers = this._pubsub?.getSubscribers(group);
      if (!peers || peers.length === 0) throw Error("Topic wo/ peers");
      const peerId = peers[Math.floor(Math.random() * peers.length)];

      const connection = await this._node?.dial(peerId);
      const stream: Stream = (await connection?.newStream(protocols)) as Stream;
      stringToStream(stream, message);

      console.log(
        `topology::network::sendMessageRandomTopicPeer: Successfuly sent message to peer: ${peerId} with message: ${message}`,
      );
    } catch (e) {
      console.error("topology::network::sendMessageRandomTopicPeer:", e);
    }
  }

  addGroupMessageHandler(handler: EventHandler<CustomEvent<GossipsubMessage>>) {
    this._pubsub?.addEventListener("gossipsub:message", handler);
  }

  addMessageHandler(protocol: string | string[], handler: StreamHandler) {
    this._node?.handle(protocol, handler);
  }
}
