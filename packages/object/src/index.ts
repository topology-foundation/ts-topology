import * as crypto from "node:crypto";
import type { TopologyObject } from "./proto/object_pb.js";
import { compileWasm } from "./wasm/compiler.js";
import type * as hashgraph from "./hashgraph.js";

export * from "./proto/object_pb.js";
export * from "./hashgraph.js";

export interface CRO<T> {
	resolveConflicts: (vertices: hashgraph.Vertex<T>[]) => hashgraph.ActionType;
	mergeCallback: (operations: hashgraph.Operation<T>[]) => void;
}

/* Creates a new TopologyObject */
export async function newTopologyObject(
	nodeId: string,
	path?: string,
	id?: string,
	abi?: string,
): Promise<TopologyObject> {
	// const bytecode = await compileWasm(path);
	const bytecode = new Uint8Array();
	return {
		id:
			id ??
			crypto
				.createHash("sha256")
				.update(abi ?? "")
				.update(nodeId)
				.update(Math.floor(Math.random() * Number.MAX_VALUE).toString())
				.digest("hex"),
		abi: abi ?? "",
		bytecode: bytecode ?? new Uint8Array(),
		operations: [],
	};
}

export async function callFn(
	obj: TopologyObject,
	fn: string,
	args: string[],
): Promise<TopologyObject> {
	obj.operations.push({
		nonce: Math.floor(Math.random() * Number.MAX_VALUE).toString(),
		fn: fn,
		args: args,
	});
	return obj;
}
