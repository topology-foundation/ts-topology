import { HashGraph, type Operation, type ResolveConflictsType, type SemanticsType, type Vertex } from "./hashgraph/index.js";
import * as ObjectPb from "./proto/object_pb.js";
export * as ObjectPb from "./proto/object_pb.js";
export * from "./hashgraph/index.js";
export interface CRO {
    operations: string[];
    semanticsType: SemanticsType;
    resolveConflicts: (vertices: Vertex[]) => ResolveConflictsType;
    mergeCallback: (operations: Operation[]) => void;
}
export type TopologyObjectCallback = (object: TopologyObject, origin: string, vertices: ObjectPb.Vertex[]) => void;
export interface ITopologyObject extends ObjectPb.TopologyObjectBase {
    cro: ProxyHandler<CRO> | null;
    hashGraph: HashGraph;
    subscriptions: TopologyObjectCallback[];
}
export declare class TopologyObject implements ITopologyObject {
    nodeId: string;
    id: string;
    abi: string;
    bytecode: Uint8Array;
    vertices: ObjectPb.Vertex[];
    cro: ProxyHandler<CRO> | null;
    hashGraph: HashGraph;
    subscriptions: TopologyObjectCallback[];
    constructor(nodeId: string, cro: CRO, id?: string, abi?: string);
    proxyCROHandler(): ProxyHandler<object>;
    callFn(fn: string, args: any): void;
    merge(vertices: Vertex[]): void;
    subscribe(callback: TopologyObjectCallback): void;
    private _notify;
}
//# sourceMappingURL=index.d.ts.map