import { program } from "./cli";
import { TopologyNode } from ".";
import { createRelayNode } from "@topology-foundation/network";

async function startNode() {
  const node = new TopologyNode();
  node.start();
}

async function startRelay() {
  const node = await createRelayNode();
  console.log("peer_id:", node.peerId.toString());
  for (let ma of node.getMultiaddrs()) {
    console.log(ma);
  }
}

program.parse(process.argv);
const opts = program.opts();

if (opts.mode === "node") {
  startNode();
} else if (opts.mode === "relay") {
  startRelay();
}
