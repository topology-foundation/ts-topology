import * as crypto from "crypto";
import { TopologyObject } from "./proto/object_pb.js";
import { compileWasm } from "./wasm/compiler.js";

export * from "./proto/object_pb.js";

async function compileCRO(path: string): Promise<Uint8Array> {
  // get the bytecode from the wasm compiler and abi
  // TODO: abi not extracted yet
  return compileWasm(path);
}

/* Creates a new TopologyObject */
export async function newTopologyObject(peerId: string, path: string, id?: string, abi?: string): Promise<TopologyObject> {
  const bytecode = await compileWasm(path);
  return {
    id: id ?? crypto
      .createHash("sha256")
      .update(abi ?? "")
      .update(peerId)
      .update(Math.floor(Math.random() * Number.MAX_VALUE).toString())
      .digest("hex"),
    abi: abi ?? "",
    bytecode: bytecode ?? new Uint8Array(),
    operations: []
  }
}

export async function callFn(obj: TopologyObject, fn: string, args: string[]): Promise<TopologyObject> {
  obj.operations.push({
    nonce: Math.floor(Math.random() * Number.MAX_VALUE).toString(),
    fn: fn,
    args: args
  });

  return obj;
}

async function run() {
  // TODO: just for testing wasm compilation with tsx, should be deleted
  let obj = await newTopologyObject("peerId", "/Users/droak/code/topology/ts-topology/examples/chat/src/objects/chat.ts", "", "");
  console.log(obj);
}
// run();
