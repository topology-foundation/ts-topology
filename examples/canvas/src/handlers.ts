import { TopologyObject_Operation } from "@topology-foundation/object";
import { Canvas } from "./objects/canvas";

export function handleObjectOps(
  canvas: Canvas,
  ops: TopologyObject_Operation[],
) {
  // In this case we only have paint
  // `paint(${node.getPeerId()}, [${[x, y]}], [${painting}])`
  try {
    for (const op of ops) {
      const offset = op.args[1]
        .split(",")
        .map((s: string) => parseInt(s, 10)) as [number, number];
      const rgb = op.args[2].split(",").map((s: string) => parseInt(s, 10)) as [
        number,
        number,
        number,
      ];
      canvas.paint(op.args[0], offset, rgb);
    }
  } catch (e) {
    console.error(e);
  }
}
