import * as crypto from "node:crypto";
import { HashGraph, } from "./hashgraph/index.js";
import * as ObjectPb from "./proto/object_pb.js";
export * as ObjectPb from "./proto/object_pb.js";
export * from "./hashgraph/index.js";
export class TopologyObject {
    nodeId;
    id;
    abi;
    bytecode;
    vertices;
    cro;
    hashGraph;
    subscriptions;
    constructor(nodeId, cro, id, abi) {
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
        this.hashGraph = new HashGraph(nodeId, cro.resolveConflicts, cro.semanticsType);
        this.subscriptions = [];
    }
    // This function is black magic, it allows us to intercept calls to the CRO object
    proxyCROHandler() {
        const obj = this;
        return {
            get(target, propKey, receiver) {
                if (typeof target[propKey] === "function") {
                    return new Proxy(target[propKey], {
                        apply(applyTarget, thisArg, args) {
                            if (thisArg.operations.includes(propKey))
                                obj.callFn(propKey, args.length === 1 ? args[0] : args);
                            return Reflect.apply(applyTarget, thisArg, args);
                        },
                    });
                }
                return Reflect.get(target, propKey, receiver);
            },
        };
    }
    // biome-ignore lint: value can't be unknown because of protobuf
    callFn(fn, args) {
        const vertex = this.hashGraph.addToFrontier({ type: fn, value: args });
        const serializedVertex = ObjectPb.Vertex.create({
            hash: vertex.hash,
            nodeId: vertex.nodeId,
            operation: vertex.operation,
            dependencies: vertex.dependencies,
        });
        this.vertices.push(serializedVertex);
        this._notify("callFn", [serializedVertex]);
    }
    merge(vertices) {
        for (const vertex of vertices) {
            // Check to avoid manually crafted `undefined` operations
            if (!vertex.operation) {
                continue;
            }
            this.hashGraph.addVertex(vertex.operation, vertex.dependencies, vertex.nodeId);
        }
        const operations = this.hashGraph.linearizeOperations();
        this.vertices = this.hashGraph.getAllVertices();
        this.cro.mergeCallback(operations);
        this._notify("merge", this.vertices);
    }
    subscribe(callback) {
        this.subscriptions.push(callback);
    }
    _notify(origin, vertices) {
        for (const callback of this.subscriptions) {
            callback(this, origin, vertices);
        }
    }
}
