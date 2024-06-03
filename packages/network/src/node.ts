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

// Missing QUIC
// https://github.com/libp2p/js-libp2p/issues/1459
enum TransportsEnum {
  WebRTC,
  WebSockets,
}

enum ConnectionEncryptionEnum {
  Noise,
  Plaintext, // useful for testing (shouldn't be used in prod)
}

enum MuxersEnum {
  // Mplex, (deprecated https://libp2p.github.io/js-libp2p/modules/_libp2p_mplex.html)
  Yamux,
}

enum PeerDiscoveryEnum {
  Bootstrap,
  KademliaDHT,
  MDNS,
  Discv5,
}

enum PubSubEnum {
  GossipSub,
  FloodSub, // useful for testing (shouldn't be used in prod)
}

// Maybe add peer/content routing in config
// TODO: add sub-options in the configs
export interface TopologyNetworkNodeConfig {
  addresses?: string[];
  transports?: TransportsEnum[];
  muxers?: MuxersEnum[];
  connectionEncryption?: ConnectionEncryptionEnum[];
  peerDiscovery?: PeerDiscoveryEnum[];
  pubSub?: PubSubEnum[]; // probably not configurable like this
}

export class TopologyNetworkNode {
  private _config: TopologyNetworkNodeConfig;
  private _node?: Libp2p;
  private _pubsub?: PubSub<GossipsubEvents>;

  constructor(config: TopologyNetworkNodeConfig) {
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

  async sendMessage() {}
}
