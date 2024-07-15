import { program } from "./cli";
import { TopologyNode } from ".";

export async function start() {
  const node = new TopologyNode();
  node.start();
}

program.parse(process.argv);
