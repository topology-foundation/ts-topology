import { TopologyNode } from "@topologygg/node";

const render = (canvas: [number, number, number][][]) => {
  const canvas_element = <HTMLDivElement>document.getElementById("canvas");
  canvas_element.style.display = "inline-grid";

  // TODO: adjust this to depend on the width x height
  canvas_element.style.gridTemplateColumns = "1fr 50px";

  for (let x = 0; x < canvas.length; x++) {
    for (let y = 0; y < canvas[x].length; y++) {
      let pixel = document.createElement("div");
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
  const rgb = pixel.style.backgroundColor
    .replace("rgb(", "")
    .replace(")", "")
    .trim()
    .split(",")
    .map((n) => parseInt(n, 10));
  // sum to current rgb in the future, for now just replace with random_int
  pixel.style.backgroundColor = `rgb(${random_int(256)}, ${random_int(256)}, ${random_int(256)})`;
}

async function init() {
  // TODO: get this from the node
  let pixels: [number, number, number][][] = [
    [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
  ];

  render(pixels);

  const node = new TopologyNode();
  await node.start();
  node.subscribe("canvas-example");
}

init();
