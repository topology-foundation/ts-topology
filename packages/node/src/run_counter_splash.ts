import { TopologyNode } from ".";
import { Canvas } from "./objects/canvas";
import * as fs from "fs";

export async function start() {
  const node = new TopologyNode();
  await node.start();

  let canvas = new Canvas(node.getPeerId(), 3000, 4000);
  canvas.id = "topology::counter_splash";
  node.createObject(canvas);
}

start();
