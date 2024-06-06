import { TopologyNode } from ".";

export async function start() {
  const node = new TopologyNode();
  node.start();
}

start();
