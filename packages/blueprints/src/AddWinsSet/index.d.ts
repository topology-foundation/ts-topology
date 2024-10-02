import { type CRO, type Operation, type ResolveConflictsType, SemanticsType, type Vertex } from "@topology-foundation/object";
export declare class AddWinsSet<T> implements CRO {
    operations: string[];
    state: Map<T, boolean>;
    semanticsType: SemanticsType;
    constructor();
    private _add;
    add(value: T): void;
    private _remove;
    remove(value: T): void;
    contains(value: T): boolean;
    values(): T[];
    resolveConflicts(vertices: Vertex[]): ResolveConflictsType;
    mergeCallback(operations: Operation[]): void;
}
//# sourceMappingURL=index.d.ts.map