import * as crypto from "crypto";
import { TopologyObject } from "./proto/object_pb.js";

export * from "./proto/index.js";

function newTopologyObject(peerId: string, abi?: string, bytecode?: string): TopologyObject {
  const id = crypto
    .createHash("sha256")
    .update(abi ?? "")
    .update(peerId)
    .update(Math.floor(Math.random() * Number.MAX_VALUE).toString())
    .digest("hex");

  return {
    id,
    abi: abi ?? "",
    bytecode: bytecode ?? ""
  };
}
