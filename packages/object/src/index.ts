import * as crypto from "crypto";
import { TopologyObject } from "./proto/object_pb.js";
import { compileWasm } from "./wasm/compiler.js";

export * from "./proto/object_pb.js";

/* Creates a new TopologyObject */
export function newTopologyObject(peerId: string, id?: string, abi?: string, bytecode?: string): TopologyObject {
  return {
    id: id ?? crypto
      .createHash("sha256")
      .update(abi ?? "")
      .update(peerId)
      .update(Math.floor(Math.random() * Number.MAX_VALUE).toString())
      .digest("hex"),
    abi: abi ?? "",
    bytecode: bytecode ?? ""
  }
}

// just for testing wasm compilation with tsx, should be deleted
let obj = newTopologyObject("peerId");
console.log(obj.id);
