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
      canvas_element.appendChild(pixel);
    }
  }
};

const init = () => {
  let pixels: [number, number, number][][] = [
    [
      [123, 142, 152],
      [123, 14, 152],
      [12, 142, 152],
    ],
    [
      [123, 142, 15],
      [12, 12, 152],
      [13, 142, 12],
    ],
  ];
  render(pixels);
};

init();
