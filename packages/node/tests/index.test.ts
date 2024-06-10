import { expect, test } from "vitest";
import { TopologyNode } from "../src/index";

test("start node", () => {
  const node = new TopologyNode();
  node.start();
});
