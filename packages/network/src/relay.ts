import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import { createFromJSON } from "@libp2p/peer-id-factory";
import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";
import { webSockets } from "@libp2p/websockets";
import * as filters from "@libp2p/websockets/filters";
import { createLibp2p } from "libp2p";

import relayerJson from "./peer-id-relayer";

// TODO:
//  - remove the peer-id-relayer in favor of static configs
//  - create a "relay" mode that can be activated in the main node.ts logic
//  - improve the circuit-relay setup
export const createRelayNode = async () => {
  const idRelayer = await createFromJSON(relayerJson);
  const node = await createLibp2p({
    peerId: idRelayer,
    addresses: {
      listen: ["/ip4/127.0.0.1/tcp/50000/ws"],
    },
    connectionEncryption: [noise()],
    connectionManager: {
      minConnections: 0,
    },
    peerDiscovery: [pubsubPeerDiscovery()],
    services: {
      identify: identify(),
      pubsub: gossipsub(),
      relay: circuitRelayServer({
        reservations: {
          maxReservations: Infinity,
        },
      }),
    },
    streamMuxers: [yamux()],
    transports: [webSockets({ filter: filters.all })],
  });

  // Log a message when a remote peer connects to us
  node.addEventListener("peer:connect", (e) => {
    const remotePeer = e.detail;
    console.log("connected to: ", remotePeer.toString());
  });

  return node;
};
