import { program } from "./cli";
import { TopologyNode, TopologyNodeConfig } from ".";
import fs from "fs";

async function startNode(config?: TopologyNodeConfig) {
  const node = new TopologyNode(config);
  node.start();
}

const run = () => {
  program.parse(process.argv);
  const opts = program.opts();

  let config: TopologyNodeConfig | undefined;
  if (opts.config) {
    config = JSON.parse(fs.readFileSync(opts.config, "utf8"));
  }

  startNode(config);
};

run();
