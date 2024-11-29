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
	// biome-ignore lint: attributes can be anything
	[key: string]: any;
}

export class CROState {
	// biome-ignore lint: attributes can be anything
	state: Map<string, any>;

	// biome-ignore lint: attributes can be anything
	constructor(state: Map<string, any>) {
		this.state = state;
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
	originalCRO: CRO;

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
		this.states = new Map([[HashGraph.rootHash, new CROState(new Map())]]);
		this.originalCRO = Object.create(
			Object.getPrototypeOf(cro),
			Object.getOwnPropertyDescriptors(structuredClone(cro)),
		);
		this.vertices = this.hashGraph.getAllVertices();
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
		const subgraph: Set<Hash> = new Set();
		const lca = this.hashGraph.lowestCommonAncestorMultipleVertices(
			vertex.dependencies,
			subgraph,
		);
		const linearizedOperations = this.hashGraph.linearizeOperations(
			lca,
			subgraph,
		);

		const cro = Object.create(
			Object.getPrototypeOf(this.originalCRO),
			Object.getOwnPropertyDescriptors(structuredClone(this.originalCRO)),
		) as CRO;

		const fetchedState = this.states.get(lca);
		if (!fetchedState) {
			throw new Error("State is undefined");
		}

		const state = Object.create(
			Object.getPrototypeOf(fetchedState),
			Object.getOwnPropertyDescriptors(structuredClone(fetchedState)),
		).state;

		for (const [key, value] of state.entries()) {
			cro[key] = value;
		}

		let applyIdx = 1;
		if (lca === HashGraph.rootHash) {
			applyIdx = 0;
		}

		for (; applyIdx < linearizedOperations.length; applyIdx++) {
			const op = linearizedOperations[applyIdx];
			cro[op.type](op.value);
		}

		cro[fn](args);

		const varNames: string[] = Object.keys(cro);
		// biome-ignore lint: values can be anything
		const newState: Map<string, any> = new Map();
		for (const varName of varNames) {
			newState.set(varName, cro[varName]);
		}

		this.states.set(vertex.hash, new CROState(newState));

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
			if (!vertex.operation || this.hashGraph.vertices.has(vertex.hash)) {
				continue;
			}

			try {
				this.hashGraph.addVertex(
					vertex.operation,
					vertex.dependencies,
					vertex.nodeId,
				);

				const subgraph: Set<Hash> = new Set();
				const lca = this.hashGraph.lowestCommonAncestorMultipleVertices(
					vertex.dependencies,
					subgraph,
				);
				const linearizedOperations = this.hashGraph.linearizeOperations(
					lca,
					subgraph,
				);

				const cro = Object.create(
					Object.getPrototypeOf(this.originalCRO),
					Object.getOwnPropertyDescriptors(structuredClone(this.originalCRO)),
				) as CRO;

				const fetchedState = this.states.get(lca);
				if (!fetchedState) {
					throw new Error("State is undefined");
				}

				const state = Object.create(
					Object.getPrototypeOf(fetchedState),
					Object.getOwnPropertyDescriptors(structuredClone(fetchedState)),
				).state;

				for (const [key, value] of state.entries()) {
					cro[key] = value;
				}

				let applyIdx = 1;
				if (lca === HashGraph.rootHash) {
					applyIdx = 0;
				}
				for (; applyIdx < linearizedOperations.length; applyIdx++) {
					const op = linearizedOperations[applyIdx];
					cro[op.type](op.value);
				}
				cro[vertex.operation.type](vertex.operation.value);

				const varNames: string[] = Object.keys(cro);
				// biome-ignore lint: values can be anything
				const newState: Map<string, any> = new Map();
				for (const varName of varNames) {
					newState.set(varName, cro[varName]);
				}

				this.states.set(vertex.hash, new CROState(newState));
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
