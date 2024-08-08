import { program } from "./cli/index.js";
import { TopologyNode, TopologyNodeConfig } from "./index.js";
import { newTopologyObject, TopologyObject } from "@topology-foundation/object";
import fs from "fs";

async function startNode(config?: TopologyNodeConfig) {
  const node = new TopologyNode(config);
  node.start();
}

const run = () => {
  program.parse(process.argv);
  const opts = program.opts();
  let a = newTopologyObject("");

  let config: TopologyNodeConfig | undefined;
  if (opts.config) {
    config = JSON.parse(fs.readFileSync(opts.config, "utf8"));
  }

  startNode(config);
};

run();
