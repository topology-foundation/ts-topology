import * as crypto from "crypto";
import { TopologyObject } from "./proto/object_pb.js";
import { compileWasm } from "./wasm/compiler.js";

export * from "./proto/object_pb.js";


export async function compileCRO(path: string): Promise<Uint8Array> {
  return compileWasm(path);
}

/* Creates a new TopologyObject */
export function newTopologyObject(peerId: string, id?: string, abi?: string, bytecode?: Uint8Array): TopologyObject {
  return {
    id: id ?? crypto
      .createHash("sha256")
      .update(abi ?? "")
      .update(peerId)
      .update(Math.floor(Math.random() * Number.MAX_VALUE).toString())
      .digest("hex"),
    abi: abi ?? "",
    bytecode: bytecode ?? new Uint8Array(),
  }
}

async function run() {
  // TODO: just for testing wasm compilation with tsx, should be deleted
  let bytecode = await compileCRO("/Users/droak/code/topology/ts-topology/packages/object/src/chat.ts");
  let obj = newTopologyObject("peerId", undefined, undefined, bytecode);
  console.log(obj);
}
run();
