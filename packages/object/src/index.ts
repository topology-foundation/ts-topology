import * as crypto from "node:crypto";
import {
	type Hash,
	HashGraph,
	type Operation,
	type ResolveConflictsType,
	type SemanticsType,
	type Vertex,
} from "./hashgraph/index.js";
import * as ObjectPb from "./proto/topology/object/object_pb.js";

export * as ObjectPb from "./proto/topology/object/object_pb.js";
export * from "./hashgraph/index.js";

export interface CRO {
	operations: string[];
	semanticsType: SemanticsType;
	resolveConflicts: (vertices: Vertex[]) => ResolveConflictsType;
	mergeCallback: (operations: Operation[]) => void;
}

export class CROState {
	cro: CRO;
	linearizedOperations: Operation[];
	// the past includes all vertices that the vertex depends on and the vertex itself
	// root has in-degree 0
	pastInDegree: Map<Hash, number>;

	constructor(
		cro: CRO,
		linearizedOperations: Operation[] = [],
		pastInDegree: Map<Hash, number> = new Map(),
	) {
		this.cro = cro;
		this.linearizedOperations = linearizedOperations;
		this.pastInDegree = pastInDegree;
	}
}

export type TopologyObjectCallback = (
	object: TopologyObject,
	origin: string,
	vertices: ObjectPb.Vertex[],
) => void;

export interface ITopologyObject extends ObjectPb.TopologyObjectBase {
	cro: ProxyHandler<CRO> | null;
	hashGraph: HashGraph;
	subscriptions: TopologyObjectCallback[];
}

export class TopologyObject implements ITopologyObject {
	nodeId: string;
	id: string;
	abi: string;
	bytecode: Uint8Array;
	vertices: ObjectPb.Vertex[];
	cro: ProxyHandler<CRO> | null;
	hashGraph: HashGraph;
	subscriptions: TopologyObjectCallback[];
	// mapping from vertex hash to the CRO state
	states: Map<string, CROState>;

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
		this.hashGraph = new HashGraph(
			nodeId,
			cro.resolveConflicts.bind(cro),
			cro.semanticsType,
		);
		this.subscriptions = [];
		this.states = new Map([[HashGraph.rootHash, new CROState(cro)]]);
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
		// the vertex certainly has dependencies
		const pastInDegree: Map<Hash, number> = new Map(
			this.states.get(vertex.dependencies[0])?.pastInDegree || [],
		);
		for (const dep of vertex.dependencies) {
			const dfs = (hash: Hash) => {
				if (pastInDegree.has(hash)) {
					return;
				}
				const v = this.hashGraph.getVertex(hash);
				if (!v) return;
				pastInDegree.set(hash, v.dependencies.length);
				for (const d of v.dependencies) {
					dfs(d);
				}
			};
			dfs(dep);
		}
		pastInDegree.set(vertex.hash, vertex.dependencies.length);
		this.states.set(
			vertex.hash,
			new CROState(
				this.cro as CRO,
				this.hashGraph.linearizeOperations(),
				pastInDegree,
			),
		);

		const serializedVertex = ObjectPb.Vertex.create({
			hash: vertex.hash,
			nodeId: vertex.nodeId,
			operation: vertex.operation,
			dependencies: vertex.dependencies,
		});
		this.vertices.push(serializedVertex);
		this._notify("callFn", [serializedVertex]);
	}

	/* Merges the vertices into the hashgraph
	 * Returns a tuple with a boolean indicating if there were
	 * missing vertices and an array with the missing vertices
	 */
	merge(vertices: Vertex[]): [merged: boolean, missing: string[]] {
		const missing = [];
		for (const vertex of vertices) {
			// Check to avoid manually crafted `undefined` operations
			if (!vertex.operation) {
				continue;
			}

			try {
				this.hashGraph.addVertex(
					vertex.operation,
					vertex.dependencies,
					vertex.nodeId,
				);

				const pastInDegree: Map<Hash, number> = new Map(
					this.states.get(vertex.dependencies[0])?.pastInDegree || [],
				);
				for (const dep of vertex.dependencies) {
					const dfs = (hash: Hash) => {
						if (pastInDegree.has(hash)) {
							return;
						}
						const v = this.hashGraph.getVertex(hash);
						if (!v) return;
						pastInDegree.set(hash, v.dependencies.length);
						for (const d of v.dependencies) {
							dfs(d);
						}
					};
					dfs(dep);
				}
				pastInDegree.set(vertex.hash, vertex.dependencies.length);
				const topoSortedPast = this.hashGraph.topoSortPast(
					new Map(pastInDegree),
				);
				this.states.set(
					vertex.hash,
					new CROState(
						this.cro as CRO,
						this.hashGraph.linearizeOperations(topoSortedPast),
						pastInDegree,
					),
				);
			} catch (e) {
				missing.push(vertex.hash);
			}
		}

		const operations = this.hashGraph.linearizeOperations();
		this.vertices = this.hashGraph.getAllVertices();

		(this.cro as CRO).mergeCallback(operations);
		this._notify("merge", this.vertices);

		return [missing.length === 0, missing];
	}

	subscribe(callback: TopologyObjectCallback) {
		this.subscriptions.push(callback);
	}

	private _notify(origin: string, vertices: ObjectPb.Vertex[]) {
		for (const callback of this.subscriptions) {
			callback(this, origin, vertices);
		}
	}
}
