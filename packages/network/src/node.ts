import { GossipsubEvents, gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import { PubSub } from "@libp2p/interface";
import { webRTC } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import * as filters from "@libp2p/websockets/filters";
import { Libp2p, createLibp2p } from "libp2p";

export interface TopologyNetworkNodeConfig {}

export class TopologyNetworkNode {
  private _config?: TopologyNetworkNodeConfig;
  private _node?: Libp2p;
  private _pubsub?: PubSub<GossipsubEvents>;

  peer_id: string = "";

  constructor(config?: TopologyNetworkNodeConfig) {
    this._config = config;
  }

  async start() {
    this._node = await createLibp2p({
      addresses: {
        listen: ["/webrtc"],
      },
      connectionEncryption: [noise()],
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

    this._pubsub = this._node.services.pubsub as PubSub<GossipsubEvents>;
    this.peer_id = this._node.peerId.toString();

    console.log(
      "topology::network::start: Successfuly started topology network w/ peer_id",
      this.peer_id,
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

  async sendMessage<T>(topic: string, message: T) {
    try {
      // TODO: decode message into uint8array
      await this._pubsub?.publish(topic, message as Uint8Array);

      // avoiding DoSing the browser
      // console.log("topology::network::sendMessage: Successfuly sent message to topic", topic)
    } catch (e) {
      console.error("topology::network::sendMessage:", e);
    }
  }

  pubSubEventListener() {
    return this._pubsub?.addEventListener;
  }
}
