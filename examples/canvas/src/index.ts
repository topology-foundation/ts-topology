import { TopologyNode } from "@topologygg/node";
import { Canvas } from "./objects/canvas";

let canvasCRO: Canvas;

const render = () => {
  const canvas = canvasCRO.canvas();
  const canvas_element = <HTMLDivElement>document.getElementById("canvas");
  canvas_element.style.display = "inline-grid";

  // TODO: adjust this to depend on the width x height
  canvas_element.style.gridTemplateColumns = "1fr 50px";

  for (let x = 0; x < canvas.length; x++) {
    for (let y = 0; y < canvas[x].length; y++) {
      let pixel = document.createElement("div");
      pixel.id = `${x}-${y}`;
      pixel.style.width = "25px";
      pixel.style.height = "25px";
      pixel.style.backgroundColor = `rgb(${canvas[x][y][0]}, ${canvas[x][y][1]}, ${canvas[x][y][2]})`;
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

  const pixelCRO = canvasCRO.pixel(x, y);
  const [r, g, b] = pixelCRO.color();

  pixel.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}

async function init() {
  const node = new TopologyNode();
  await node.start();

  canvasCRO = new Canvas(5, 10);

  // create cro within the node
  // node.createObject(canvas);
  // subscribe to existing cro

  render();
}

init();
