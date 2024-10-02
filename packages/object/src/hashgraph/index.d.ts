import { Vertex_Operation as Operation, Vertex } from "../proto/object_pb.js";
export { Vertex, Operation };
export type Hash = string;
export declare enum OperationType {
    NOP = "-1"
}
export declare enum ActionType {
    DropLeft = 0,
    DropRight = 1,
    Nop = 2,
    Swap = 3,
    Drop = 4
}
export declare enum SemanticsType {
    pair = 0,
    multiple = 1
}
export type ResolveConflictsType = {
    action: ActionType;
    vertices?: Hash[];
};
export declare class HashGraph {
    nodeId: string;
    resolveConflicts: (vertices: Vertex[]) => ResolveConflictsType;
    semanticsType: SemanticsType;
    vertices: Map<Hash, Vertex>;
    frontier: Hash[];
    forwardEdges: Map<Hash, Hash[]>;
    static readonly rootHash: Hash;
    private arePredecessorsFresh;
    private reachablePredecessors;
    private topoSortedIndex;
    private currentBitsetSize;
    constructor(nodeId: string, resolveConflicts: (vertices: Vertex[]) => ResolveConflictsType, semanticsType: SemanticsType);
    addToFrontier(operation: Operation): Vertex;
    addVertex(operation: Operation, deps: Hash[], nodeId: string): Hash;
    topologicalSort(updateBitsets?: boolean): Hash[];
    linearizeOperations(): Operation[];
    areCausallyRelatedUsingBitsets(hash1: Hash, hash2: Hash): boolean;
    areCausallyRelatedUsingBFS(hash1: Hash, hash2: Hash): boolean;
    getFrontier(): Hash[];
    getDependencies(vertexHash: Hash): Hash[];
    getVertex(hash: Hash): Vertex | undefined;
    getAllVertices(): Vertex[];
}
//# sourceMappingURL=index.d.ts.map