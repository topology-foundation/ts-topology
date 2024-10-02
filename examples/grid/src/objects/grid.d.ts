import { type CRO, type Operation, type ResolveConflictsType, SemanticsType, type Vertex } from "@topology-foundation/object";
export declare class Grid implements CRO {
    operations: string[];
    semanticsType: SemanticsType;
    positions: Map<string, {
        x: number;
        y: number;
    }>;
    constructor();
    addUser(userId: string, color: string): void;
    private _addUser;
    moveUser(userId: string, direction: string): void;
    private _moveUser;
    getUsers(): string[];
    getUserPosition(userColorString: string): {
        x: number;
        y: number;
    } | undefined;
    resolveConflicts(vertices: Vertex[]): ResolveConflictsType;
    mergeCallback(operations: Operation[]): void;
}
export declare function createGrid(): Grid;
//# sourceMappingURL=grid.d.ts.map