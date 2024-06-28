import { TopologyNode } from ".";
import { Canvas } from "./objects/canvas";

export async function start() {
  const node = new TopologyNode();
  node.start();

  node.subscribeObject("topology::counter_splash");

  let canvas = new Canvas(node.getPeerId(), 1000, 1000);
  canvas.id = "topology::counter_splash";
  node.createObject(canvas);
}

start();
