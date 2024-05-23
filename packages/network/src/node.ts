import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { mdns } from "@libp2p/mdns";
import { mplex } from "@libp2p/mplex";
import { tcp } from "@libp2p/tcp";
import { createLibp2p } from "libp2p";

export const createP2pNode = async () => {
  const node = await createLibp2p({
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/0"],
    },
    transports: [tcp()],
    streamMuxers: [yamux(), mplex()],
    connectionEncryption: [noise()],
    peerDiscovery: [
      mdns({
        interval: 20e3,
      }),
    ],
  });

  return node;
};
