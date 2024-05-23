import { createP2pNode } from "./node";

export async function run() {
  const [node1, node2] = await Promise.all([createP2pNode(), createP2pNode()]);

  node1.addEventListener("peer:discovery", (evt) =>
    console.log("Discovered:", evt.detail.id.toString()),
  );
  node2.addEventListener("peer:discovery", (evt) =>
    console.log("Discovered:", evt.detail.id.toString()),
  );
}
