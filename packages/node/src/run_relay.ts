import { createRelayNode } from "@topologygg/network";

export async function start() {
  const node = await createRelayNode();
  console.log("peer_id:", node.peerId.toString());
  for (let ma of node.getMultiaddrs()) {
    console.log(ma);
  }
}

start();
