import * as crypto from "node:crypto";
import { Logger, type LoggerOptions } from "@ts-drp/logger";
import {
	type Hash,
	HashGraph,
	type Operation,
	type ResolveConflictsType,
	type SemanticsType,
	type Vertex,
} from "./hashgraph/index.js";
import * as ObjectPb from "./proto/drp/object/v1/object_pb.js";

export * as ObjectPb from "./proto/drp/object/v1/object_pb.js";
export * from "./hashgraph/index.js";

export interface DRP {
	operations: string[];
	semanticsType: SemanticsType;
	resolveConflicts: (vertices: Vertex[]) => ResolveConflictsType;
	mergeCallback: (operations: Operation[]) => void;
	// biome-ignore lint: attributes can be anything
	[key: string]: any;
}

export class DRPState {
	// biome-ignore lint: attributes can be anything
	state: Map<string, any>;

	// biome-ignore lint: attributes can be anything
	constructor(state: Map<string, any>) {
		this.state = state;
	}
}

export type DRPObjectCallback = (
	object: DRPObject,
	origin: string,
	vertices: ObjectPb.Vertex[],
) => void;

export interface IDRPObject extends ObjectPb.DRPObjectBase {
	drp: ProxyHandler<DRP> | null;
	hashGraph: HashGraph;
	subscriptions: DRPObjectCallback[];
}

// snake_casing to match the JSON config
export interface DRPObjectConfig {
	log_config?: LoggerOptions;
}

export let log: Logger;

export class DRPObject implements IDRPObject {
	nodeId: string;
	id: string;
	abi: string;
	bytecode: Uint8Array;
	vertices: ObjectPb.Vertex[];
	drp: ProxyHandler<DRP> | null;
	hashGraph: HashGraph;
	// mapping from vertex hash to the DRP state
	states: Map<string, DRPState>;
	originalDRP: DRP;
	subscriptions: DRPObjectCallback[];

	constructor(
		nodeId: string,
		drp: DRP,
		id?: string,
		abi?: string,
		config?: DRPObjectConfig,
	) {
		this.nodeId = nodeId;
		log = new Logger("drp::object", config?.log_config);
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
		this.drp = drp ? new Proxy(drp, this.proxyDRPHandler()) : null;
		this.hashGraph = new HashGraph(
			nodeId,
			drp?.resolveConflicts?.bind(drp ?? this),
			drp?.semanticsType,
		);
		this.subscriptions = [];
		this.states = new Map([[HashGraph.rootHash, new DRPState(new Map())]]);
		this.originalDRP = Object.create(
			Object.getPrototypeOf(drp),
			Object.getOwnPropertyDescriptors(structuredClone(drp)),
		);
		this.vertices = this.hashGraph.getAllVertices();
	}

	// This function is black magic, it allows us to intercept calls to the DRP object
	proxyDRPHandler(): ProxyHandler<object> {
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

		const drp = Object.create(
			Object.getPrototypeOf(this.originalDRP),
			Object.getOwnPropertyDescriptors(structuredClone(this.originalDRP)),
		) as DRP;

		const fetchedState = this.states.get(lca);
		if (!fetchedState) {
			throw new Error("State is undefined");
		}

		const state = Object.create(
			Object.getPrototypeOf(fetchedState),
			Object.getOwnPropertyDescriptors(structuredClone(fetchedState)),
		).state;

		for (const [key, value] of state.entries()) {
			drp[key] = value;
		}

		let applyIdx = 1;
		if (lca === HashGraph.rootHash) {
			applyIdx = 0;
		}

		for (; applyIdx < linearizedOperations.length; applyIdx++) {
			const op = linearizedOperations[applyIdx];
			drp[op.type](op.value);
		}

		drp[fn](args);

		const varNames: string[] = Object.keys(drp);
		// biome-ignore lint: values can be anything
		const newState: Map<string, any> = new Map();
		for (const varName of varNames) {
			newState.set(varName, drp[varName]);
		}

		this.states.set(vertex.hash, new DRPState(newState));

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

				const drp = Object.create(
					Object.getPrototypeOf(this.originalDRP),
					Object.getOwnPropertyDescriptors(structuredClone(this.originalDRP)),
				) as DRP;

				const fetchedState = this.states.get(lca);
				if (!fetchedState) {
					throw new Error("State is undefined");
				}

				const state = Object.create(
					Object.getPrototypeOf(fetchedState),
					Object.getOwnPropertyDescriptors(structuredClone(fetchedState)),
				).state;

				for (const [key, value] of state.entries()) {
					drp[key] = value;
				}

				let applyIdx = 1;
				if (lca === HashGraph.rootHash) {
					applyIdx = 0;
				}
				for (; applyIdx < linearizedOperations.length; applyIdx++) {
					const op = linearizedOperations[applyIdx];
					drp[op.type](op.value);
				}
				drp[vertex.operation.type](vertex.operation.value);

				const varNames: string[] = Object.keys(drp);
				// biome-ignore lint: values can be anything
				const newState: Map<string, any> = new Map();
				for (const varName of varNames) {
					newState.set(varName, drp[varName]);
				}

				this.states.set(vertex.hash, new DRPState(newState));
			} catch (e) {
				missing.push(vertex.hash);
			}
		}

		const operations = this.hashGraph.linearizeOperations();
		this.vertices = this.hashGraph.getAllVertices();

		(this.drp as DRP).mergeCallback(operations);
		this._notify("merge", this.vertices);

		return [missing.length === 0, missing];
	}

	subscribe(callback: DRPObjectCallback) {
		this.subscriptions.push(callback);
	}

	private _notify(origin: string, vertices: ObjectPb.Vertex[]) {
		for (const callback of this.subscriptions) {
			callback(this, origin, vertices);
		}
	}
}
