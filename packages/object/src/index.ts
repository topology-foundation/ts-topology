import * as crypto from "node:crypto";
import {
	type ActionType,
	HashGraph,
	type Operation,
	type Vertex,
} from "./hashgraph/index.js";
import {
	type TopologyObjectBase,
	Vertex as VertexPb,
} from "./proto/object_pb.js";

export * as ObjectPb from "./proto/object_pb.js";
export * from "./hashgraph/index.js";

export interface CRO {
	resolveConflicts: (vertices: Vertex[]) => ActionType;
	mergeCallback: (operations: Operation[]) => void;
}

export type TopologyObjectCallback = (
	object: TopologyObject,
	origin: string,
	vertices: VertexPb[],
) => void;

export interface ITopologyObject extends TopologyObjectBase {
	cro: ProxyHandler<CRO> | null;
	hashGraph: HashGraph;
	subscriptions: TopologyObjectCallback[];
}

export class TopologyObject implements ITopologyObject {
	nodeId: string;
	id: string;
	abi: string;
	bytecode: Uint8Array;
	vertices: VertexPb[];
	cro: ProxyHandler<CRO> | null;
	hashGraph: HashGraph;
	subscriptions: TopologyObjectCallback[];

	constructor(nodeId: string, cro: CRO, id?: string, abi?: string) {
		this.nodeId = nodeId;
		this.id =
			id ??
			crypto
				.createHash("sha256")
				.update(abi ?? "")
				.update(nodeId)
				.update(Math.floor(Math.random() * Number.MAX_VALUE).toString())
				.digest("hex");
		this.abi = abi ?? "";
		this.bytecode = new Uint8Array();
		this.vertices = [];
		this.cro = new Proxy(cro, this.proxyCROHandler());
		this.hashGraph = new HashGraph(nodeId, cro.resolveConflicts);
		this.subscriptions = [];
	}

	// This function is black magic, it allows us to intercept calls to the CRO object
	proxyCROHandler(): ProxyHandler<object> {
		const obj = this;
		return {
			get(target, propKey, receiver) {
				if (typeof target[propKey as keyof object] === "function") {
					return new Proxy(target[propKey as keyof object], {
						apply(applyTarget, thisArg, args) {
							if ((thisArg.operations as string[]).includes(propKey as string))
								obj.callFn(
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

	// biome-ignore lint: value can't be unknown because of protobuf
	callFn(fn: string, args: any) {
		const vertex = this.hashGraph.addToFrontier({ type: fn, value: args });
		const serializedVertex = VertexPb.create({
			hash: vertex.hash,
			nodeId: vertex.nodeId,
			operation: {
				type: vertex.operation.type,
				value: vertex.operation.value,
			},
			dependencies: vertex.dependencies,
		});
		this.vertices.push(serializedVertex);
		this._notify("callFn", [serializedVertex]);
	}

	merge(obj: TopologyObject, vertices: Vertex[]) {
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
					value: vertex.operation.value,
				},
				dependencies: vertex.dependencies,
			};
		});

		(obj.cro as CRO).mergeCallback(operations);
		this._notify("merge", obj.vertices);
	}

	subscribe(callback: TopologyObjectCallback) {
		this.subscriptions.push(callback);
	}

	private _notify(origin: string, vertices: VertexPb[]) {
		for (const callback of this.subscriptions) {
			callback(this, origin, vertices);
		}
	}
}
