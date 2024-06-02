import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import { webSockets } from "@libp2p/websockets";
import * as filters from "@libp2p/websockets/filters";
import { createLibp2p } from "libp2p";

export const createRelayNode = async () => {
  const node = await createLibp2p({
    addresses: {
      listen: ["/ip4/127.0.0.1/tcp/0/ws"],
    },
    connectionEncryption: [noise()],
    services: {
      identify: identify(),
      relay: circuitRelayServer(),
    },
    streamMuxers: [yamux()],
    transports: [webSockets({ filter: filters.all })],
  });

  return node;
};
