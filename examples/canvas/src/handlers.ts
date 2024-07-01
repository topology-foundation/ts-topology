import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { ICanvas } from "./objects/canvas";

// TODO: this should be superseded by wasm and main ts-topology library
export const handleCanvasMessages = (canvas: ICanvas, e: any) => {
  if (e.detail.msg.topic === "_peer-discovery._p2p._pubsub") return;
  const input = uint8ArrayToString(e.detail.msg.data);
  const message = JSON.parse(input);
  switch (message["type"]) {
    case "object_update": {
      const fn = uint8ArrayToString(new Uint8Array(message["data"]));
      handleObjectUpdate(canvas, fn);
      break;
    }
    default: {
      break;
    }
  }
};

function handleObjectUpdate(canvas: ICanvas, fn: string) {
  // In this case we only have paint
  // `paint(${node.getPeerId()}, [${[x, y]}], [${painting}])`
  let args = fn.replace("paint(", "").replace(")", "").split(", ");
  let offset_p = args[1]
    .replace("[", "")
    .replace("]", "")
    .split(",")
    .map((s) => parseInt(s, 10));
  const offset: [number, number] = [offset_p[0], offset_p[1]];
  let rgb_p = args[2]
    .replace("[", "")
    .replace("]", "")
    .split(",")
    .map((s) => parseInt(s, 10));
  const rgb: [number, number, number] = [rgb_p[0], rgb_p[1], rgb_p[2]];

  try {
    canvas.paint(args[0], offset, rgb);
  } catch (e) {
    console.error(e);
  }
}
