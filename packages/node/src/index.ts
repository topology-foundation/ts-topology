import { createP2pNode } from "@topologygg/network";

export async function start() {
  const [node1, node2] = await Promise.all([createP2pNode(), createP2pNode()]);

  node1.addEventListener("peer:discovery", (evt) =>
    console.log("Discovered:", evt.detail.id.toString()),
  );
  node2.addEventListener("peer:discovery", (evt) =>
    console.log("Discovered:", evt.detail.id.toString()),
  );
}

start();
