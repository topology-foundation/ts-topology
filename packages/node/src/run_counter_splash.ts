import { TopologyNode } from ".";
import { Canvas } from "./objects/canvas";
import * as fs from "fs";

export async function start() {
  const node = new TopologyNode();
  await node.start();

  let canvas = new Canvas(node.getPeerId(), 3000, 4000);
  canvas.id = "topology::counter_splash";
  fs.writeFile("./object.json", JSON.stringify(canvas), (err: any) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("File has been created");
  });
  node.createObject(canvas);
}

start();
