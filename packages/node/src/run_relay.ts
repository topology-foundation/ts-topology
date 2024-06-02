import { createRelayNode } from "@topologygg/network";

export async function start() {
  const node = await createRelayNode();
  console.log(node.peerId.toString());
}

start();
