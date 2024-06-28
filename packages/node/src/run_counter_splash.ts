import { TopologyNode } from ".";
import { Canvas } from "./objects/canvas";

export async function start() {
  const node = new TopologyNode();
  await node.start();

  let canvas = new Canvas(node.getPeerId(), 1000, 1000);
  canvas.id = "topology::counter_splash";
  node.createObject(canvas);
}

start();
