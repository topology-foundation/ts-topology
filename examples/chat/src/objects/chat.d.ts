import { type CRO, type Operation, type ResolveConflictsType, SemanticsType, type Vertex } from "@topology-foundation/object";
export declare class Chat implements CRO {
    operations: string[];
    semanticsType: SemanticsType;
    messages: Set<string>;
    constructor();
    addMessage(timestamp: string, message: string, nodeId: string): void;
    private _addMessage;
    getMessages(): Set<string>;
    resolveConflicts(vertices: Vertex[]): ResolveConflictsType;
    mergeCallback(operations: Operation[]): void;
}
//# sourceMappingURL=chat.d.ts.map