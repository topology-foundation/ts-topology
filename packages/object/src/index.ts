import * as crypto from "node:crypto";
import {
	type ActionType,
	HashGraph,
	type Operation,
	type Vertex,
} from "./hashgraph.js";
import type { TopologyObjectBase } from "./proto/object_pb.js";
import { compileWasm } from "./wasm/compiler.js";

export * from "./proto/object_pb.js";
export * from "./hashgraph.js";

export interface CRO<T> {
	resolveConflicts: (vertices: Vertex<T>[]) => ActionType;
	mergeCallback: (operations: Operation<T>[]) => void;
}

export interface TopologyObject<T> extends TopologyObjectBase {
	cro: ProxyHandler<CRO<T>> | null;
	hashGraph: HashGraph<T>;
}

/* Creates a new TopologyObject */
export async function newTopologyObject<T>(
	nodeId: string,
	cro: CRO<T>,
	path?: string,
	id?: string,
	abi?: string,
): Promise<TopologyObject<T>> {
	// const bytecode = await compileWasm(path);
	const bytecode = new Uint8Array();
	const obj: TopologyObject<T> = {
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
		hashGraph: new HashGraph<T>(nodeId, cro.resolveConflicts),
	};
	obj.cro = new Proxy(cro, proxyCROHandler(obj));
	return obj;
}

// This function is black magic, it allows us to intercept calls to the CRO object
function proxyCROHandler<T>(obj: TopologyObject<T>): ProxyHandler<object> {
	return {
		get(target, propKey, receiver) {
			if (typeof target[propKey as keyof object] === "function") {
				return new Proxy(target[propKey as keyof object], {
					apply(applyTarget, thisArg, args) {
						if ((thisArg.operations as string[]).includes(propKey as string))
							callFn(obj, propKey as string, args);
						return Reflect.apply(applyTarget, thisArg, args);
					},
				});
			}
			return Reflect.get(target, propKey, receiver);
		},
	};
}

export async function callFn<T>(
	obj: TopologyObject<T>,
	fn: string,
	args: string[],
): Promise<TopologyObject<T>> {
	obj.hashGraph.addToFrontier({ type: fn, value: args.join(",") as T });

	return obj;
}

export async function merge<T>(obj: TopologyObject<T>, vertices: Vertex<T>[]) {
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
	(obj.cro as CRO<T>).mergeCallback(operations);
}
