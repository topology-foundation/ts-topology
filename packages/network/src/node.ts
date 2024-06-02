import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import { webRTC } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import * as filters from "@libp2p/websockets/filters";
import { createLibp2p } from "libp2p";

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
export interface P2pNodeConfig {
  addresses?: string[];
  transports?: TransportsEnum[];
  muxers?: MuxersEnum[];
  connectionEncryption?: ConnectionEncryptionEnum[];
  peerDiscovery?: PeerDiscoveryEnum[];
  pubSub?: PubSubEnum[]; // probably not configurable like this
}

export const createP2pNode = async () => {
  const node = await createLibp2p({
    addresses: {
      listen: ["/webrtc"],
    },
    connectionEncryption: [noise()],
    services: {
      identify: identify(),
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

  return node;
};
