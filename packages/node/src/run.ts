import { program } from "./cli";
import { TopologyNode, TopologyNodeConfig } from ".";
import { createRelayNode } from "@topology-foundation/network";
import fs from "fs";

async function startNode(config?: TopologyNodeConfig) {
  const node = new TopologyNode(config);
  node.start();
}

async function startRelay(config?: TopologyNodeConfig) {
  const node = await createRelayNode(config?.network_config);
  console.log("peer_id:", node.peerId.toString());
  for (let ma of node.getMultiaddrs()) {
    console.log(ma);
  }
}

const run = () => {
  program.parse(process.argv);
  const opts = program.opts();

  let config: TopologyNodeConfig | undefined;
  if (opts.config) {
    config = JSON.parse(fs.readFileSync(opts.config, "utf8"));
  }

  if (opts.mode === "node") {
    startNode(config);
  } else if (opts.mode === "relay") {
    startRelay(config);
  }
};

run();
