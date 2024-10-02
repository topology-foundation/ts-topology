import { type CRO, type Operation, type ResolveConflictsType, SemanticsType } from "@topology-foundation/object";
import { Pixel } from "./pixel";
export declare class Canvas implements CRO {
    operations: string[];
    semanticsType: SemanticsType;
    width: number;
    height: number;
    canvas: Pixel[][];
    constructor(width: number, height: number);
    splash(offset: [number, number], size: [number, number], rgb: [number, number, number]): void;
    paint(offset: [number, number], rgb: [number, number, number]): void;
    private _splash;
    private _paint;
    pixel(x: number, y: number): Pixel;
    resolveConflicts(_: any): ResolveConflictsType;
    mergeCallback(operations: Operation[]): void;
}
//# sourceMappingURL=canvas.d.ts.map