import { TopologyNode } from "@topology-foundation/node";
import { Canvas, ICanvas } from "./objects/canvas";
import { TopologyObject } from "@topology-foundation/object";
import { Pixel } from "./objects/pixel";
import { GCounter } from "@topology-foundation/crdt";

const node = new TopologyNode();
let canvasCRO: Canvas;

const render = () => {
  const canvas = canvasCRO.canvas;
  const canvas_element = <HTMLDivElement>document.getElementById("canvas");
  canvas_element.style.display = "inline-grid";

  // TODO: adjust this to depend on the width x height
  canvas_element.style.gridTemplateColumns = Array(canvas.length)
    .fill("1fr")
    .join(" ");

  for (let x = 0; x < canvas.length; x++) {
    for (let y = 0; y < canvas[x].length; y++) {
      let pixel = document.createElement("div");
      pixel.id = `${x}-${y}`;
      pixel.style.width = "25px";
      pixel.style.height = "25px";
      pixel.style.backgroundColor = `rgb(${canvas[x][y].color()[0]}, ${canvas[x][y].color()[1]}, ${canvas[x][y].color()[2]})`;
      pixel.style.cursor = "pointer";
      pixel.addEventListener("click", () => paint_pixel(pixel));
      canvas_element.appendChild(pixel);
    }
  }
};

const random_int = (max: number) => Math.floor(Math.random() * max);

async function paint_pixel(pixel: HTMLDivElement) {
  const [x, y] = pixel.id.split("-").map((v) => parseInt(v, 10));
  canvasCRO.paint(
    "",
    [x, y],
    [random_int(256), random_int(256), random_int(256)],
  );
  const [r, g, b] = canvasCRO.pixel(x, y).color();
  pixel.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

  node.updateObject(canvasCRO);
}

async function init() {
  await node.start();

  let create_button = <HTMLButtonElement>document.getElementById("create");
  create_button.addEventListener("click", () => {
    canvasCRO = new Canvas(node.getPeerId(), 5, 10);
    node.createObject(canvasCRO);

    (<HTMLSpanElement>document.getElementById("canvasId")).innerText =
      canvasCRO.getObjectId();
    render();
  });

  let connect_button = <HTMLButtonElement>document.getElementById("connect");
  connect_button.addEventListener("click", async () => {
    let croId = (<HTMLInputElement>document.getElementById("canvasIdInput"))
      .value;
    try {
      // TODO don't create a new canvas
      // canvasCRO = new Canvas(5, 10);

      await node.subscribeObject(croId);

      let object: any = node.getObject(croId);
      object["canvas"] = object["canvas"].map((x: any) =>
        x.map((y: any) => {
          y["red"] = Object.assign(new GCounter({}), y["red"]);
          y["green"] = Object.assign(new GCounter({}), y["green"]);
          y["blue"] = Object.assign(new GCounter({}), y["blue"]);
          return Object.assign(new Pixel(node.getPeerId()), y);
        }),
      );

      canvasCRO = Object.assign(new Canvas(node.getPeerId(), 0, 0), object);

      (<HTMLSpanElement>document.getElementById("canvasId")).innerText = croId;
      // node.sendObjectUpdate(croId);
      render();
    } catch (e) {
      console.error("Error while connecting with CRO", croId, e);
    }
  });
}

init();
