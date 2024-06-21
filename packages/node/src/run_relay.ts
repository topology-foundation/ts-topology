import { createRelayNode } from "@topology-foundation/network";

export async function start() {
  try {
    const node = await createRelayNode();
    console.log("peer_id:", node.peerId.toString());
    for (let ma of node.getMultiaddrs()) {
      console.log(ma);
    }
  } catch (e) {
    console.error(e);
    start();
  }
}

start();
