import { GossipsubEvents, gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import { EventHandler, PubSub, Stream, StreamHandler } from "@libp2p/interface";
import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";
import { webRTC } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import * as filters from "@libp2p/websockets/filters";
import { Libp2p, createLibp2p } from "libp2p";
import { multiaddr } from "multiaddr";
import { stringToStream } from "./stream";

export interface TopologyNetworkNodeConfig {}

export class TopologyNetworkNode {
  private _config?: TopologyNetworkNodeConfig;
  private _node?: Libp2p;
  private _pubsub?: PubSub<GossipsubEvents>;

  peerId: string = "";

  constructor(config?: TopologyNetworkNodeConfig) {
    this._config = config;
  }

  async start() {
    this._node = await createLibp2p({
      addresses: {
        listen: ["/webrtc"],
      },
      connectionEncryption: [noise()],
      connectionGater: {
        denyDialMultiaddr: () => {
          return false;
        },
      },
      peerDiscovery: [pubsubPeerDiscovery()],
      services: {
        identify: identify(),
        pubsub: gossipsub(),
      },
      streamMuxers: [yamux()],
      transports: [
        webSockets({ filter: filters.all }),
        webRTC(),
        circuitRelayTransport({
          discoverRelays: 1,
        }),
      ],
    });

    // bootstrap
    // TODO: use another technique instead of dial
    await this._node.dial([
      multiaddr(
        "/ip4/127.0.0.1/tcp/50000/ws/p2p/Qma3GsJmB47xYuyahPZPSadh1avvxfyYQwk8R3UnFrQ6aP",
      ),
    ]);

    this._pubsub = this._node.services.pubsub as PubSub<GossipsubEvents>;
    this.peerId = this._node.peerId.toString();

    console.log(
      "topology::network::start: Successfuly started topology network w/ peer_id",
      this.peerId,
    );

    this._node.addEventListener("peer:connect", (evt) => {
      console.log("topology::network::peer::connect: ", evt.detail.toString());
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

  async sendMessageRandomTopicPeer(
    topic: string,
    protocols: string[],
    message: string,
  ) {
    try {
      const peers = this._pubsub?.getSubscribers(topic);
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

  addPubsubEventListener(
    type: keyof GossipsubEvents,
    event: EventHandler<CustomEvent<any>>,
  ) {
    this._pubsub?.addEventListener(type, event);
  }

  addMessageHandler(protocol: string | string[], handler: StreamHandler) {
    this._node?.handle(protocol, handler);
  }
}
