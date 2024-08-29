import * as crypto from "node:crypto";
import {
	type ActionType,
	HashGraph,
	type Operation,
	type Vertex,
} from "./hashgraph.js";
import type { TopologyObjectBase } from "./proto/object_pb.js";

export * from "./proto/object_pb.js";
export * from "./hashgraph.js";

export interface CRO {
	resolveConflicts: (vertices: Vertex[]) => ActionType;
	mergeCallback: (operations: Operation[]) => void;
}

export interface TopologyObject extends TopologyObjectBase {
	cro: ProxyHandler<CRO> | null;
	hashGraph: HashGraph;
}

/* Creates a new TopologyObject */
export async function newTopologyObject(
	nodeId: string,
	cro: CRO,
	id?: string,
	abi?: string,
): Promise<TopologyObject> {
	// const bytecode = await compileWasm(path);
	const bytecode = new Uint8Array();
	const obj: TopologyObject = {
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
		vertices: [],
		cro: null,
		hashGraph: new HashGraph(nodeId, cro.resolveConflicts),
	};
	obj.cro = new Proxy(cro, proxyCROHandler(obj));
	return obj;
}

// This function is black magic, it allows us to intercept calls to the CRO object
function proxyCROHandler(obj: TopologyObject): ProxyHandler<object> {
	return {
		get(target, propKey, receiver) {
			if (typeof target[propKey as keyof object] === "function") {
				return new Proxy(target[propKey as keyof object], {
					apply(applyTarget, thisArg, args) {
						if ((thisArg.operations as string[]).includes(propKey as string))
							callFn(
								obj,
								propKey as string,
								args.length === 1 ? args[0] : args,
							);
						return Reflect.apply(applyTarget, thisArg, args);
					},
				});
			}
			return Reflect.get(target, propKey, receiver);
		},
	};
}

export async function callFn(
	obj: TopologyObject,
	fn: string,
	args: unknown,
): Promise<TopologyObject> {
	obj.hashGraph.addToFrontier({ type: fn, value: args });
	return obj;
}

export async function merge(obj: TopologyObject, vertices: Vertex[]) {
	for (const vertex of vertices) {
		obj.hashGraph.addVertex(
			vertex.operation,
			vertex.dependencies,
			vertex.nodeId,
		);
	}

	const operations = obj.hashGraph.linearizeOperations();
	// TODO remove this in favor of RIBLT
	obj.vertices = obj.hashGraph.getAllVertices().map((vertex) => {
		return {
			hash: vertex.hash,
			nodeId: vertex.nodeId,
			operation: {
				type: vertex.operation.type,
				value: vertex.operation.value as string,
			},
			dependencies: vertex.dependencies,
		};
	});

	(obj.cro as CRO).mergeCallback(operations);
}
