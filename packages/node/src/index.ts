import { createP2pNode } from "@topologygg/network";

export async function start(): Promise<string> {
  const node = await createP2pNode();

  return node.peerId.toString();
}
