import { TopologyNode } from "@topology-foundation/node";
import { Canvas, ICanvas } from "./objects/canvas";
import { Pixel } from "./objects/pixel";
import { GCounter } from "@topology-foundation/crdt";

const node = new TopologyNode();
let canvasCRO: ICanvas;

const render = () => {
  const canvas = canvasCRO.canvas;
  const canvas_element = <HTMLDivElement>document.getElementById("canvas");
  canvas_element.innerHTML = "";
  canvas_element.style.display = "inline-grid";

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
  const painting: [number, number, number] = [
    random_int(256),
    random_int(256),
    random_int(256),
  ];
  canvasCRO.paint(node.getPeerId(), [x, y], painting);
  const [r, g, b] = canvasCRO.pixel(x, y).color();
  pixel.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

  node.updateObject(
    canvasCRO,
    `paint(${node.getPeerId()}, ${[x, y]}, ${painting})`,
  );
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
      await node.subscribeObject(croId);
      // TODO remove the need to click to time for subscribe and fetch

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
      render();
    } catch (e) {
      console.error("Error while connecting with CRO", croId, e);
    }
  });
}

init();
