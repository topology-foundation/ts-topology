import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "topology.object";
/** Supposed to be the RIBLT stuff */
export interface Vertex {
    hash: string;
    nodeId: string;
    operation: Vertex_Operation | undefined;
    dependencies: string[];
}
export interface Vertex_Operation {
    type: string;
    value: any | undefined;
}
export interface TopologyObjectBase {
    id: string;
    abi?: string | undefined;
    bytecode?: Uint8Array | undefined;
    vertices: Vertex[];
}
export declare const Vertex: {
    encode(message: Vertex, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): Vertex;
    fromJSON(object: any): Vertex;
    toJSON(message: Vertex): unknown;
    create<I extends {
        hash?: string | undefined;
        nodeId?: string | undefined;
        operation?: {
            type?: string | undefined;
            value?: any | undefined;
        } | undefined;
        dependencies?: string[] | undefined;
    } & {
        hash?: string | undefined;
        nodeId?: string | undefined;
        operation?: ({
            type?: string | undefined;
            value?: any | undefined;
        } & {
            type?: string | undefined;
            value?: any | undefined;
        } & { [K in Exclude<keyof I["operation"], keyof Vertex_Operation>]: never; }) | undefined;
        dependencies?: (string[] & string[] & { [K_1 in Exclude<keyof I["dependencies"], keyof string[]>]: never; }) | undefined;
    } & { [K_2 in Exclude<keyof I, keyof Vertex>]: never; }>(base?: I | undefined): Vertex;
    fromPartial<I_1 extends {
        hash?: string | undefined;
        nodeId?: string | undefined;
        operation?: {
            type?: string | undefined;
            value?: any | undefined;
        } | undefined;
        dependencies?: string[] | undefined;
    } & {
        hash?: string | undefined;
        nodeId?: string | undefined;
        operation?: ({
            type?: string | undefined;
            value?: any | undefined;
        } & {
            type?: string | undefined;
            value?: any | undefined;
        } & { [K_3 in Exclude<keyof I_1["operation"], keyof Vertex_Operation>]: never; }) | undefined;
        dependencies?: (string[] & string[] & { [K_4 in Exclude<keyof I_1["dependencies"], keyof string[]>]: never; }) | undefined;
    } & { [K_5 in Exclude<keyof I_1, keyof Vertex>]: never; }>(object: I_1): Vertex;
};
export declare const Vertex_Operation: {
    encode(message: Vertex_Operation, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): Vertex_Operation;
    fromJSON(object: any): Vertex_Operation;
    toJSON(message: Vertex_Operation): unknown;
    create<I extends {
        type?: string | undefined;
        value?: any | undefined;
    } & {
        type?: string | undefined;
        value?: any | undefined;
    } & { [K in Exclude<keyof I, keyof Vertex_Operation>]: never; }>(base?: I | undefined): Vertex_Operation;
    fromPartial<I_1 extends {
        type?: string | undefined;
        value?: any | undefined;
    } & {
        type?: string | undefined;
        value?: any | undefined;
    } & { [K_1 in Exclude<keyof I_1, keyof Vertex_Operation>]: never; }>(object: I_1): Vertex_Operation;
};
export declare const TopologyObjectBase: {
    encode(message: TopologyObjectBase, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): TopologyObjectBase;
    fromJSON(object: any): TopologyObjectBase;
    toJSON(message: TopologyObjectBase): unknown;
    create<I extends {
        id?: string | undefined;
        abi?: string | undefined;
        bytecode?: Uint8Array | undefined;
        vertices?: {
            hash?: string | undefined;
            nodeId?: string | undefined;
            operation?: {
                type?: string | undefined;
                value?: any | undefined;
            } | undefined;
            dependencies?: string[] | undefined;
        }[] | undefined;
    } & {
        id?: string | undefined;
        abi?: string | undefined;
        bytecode?: Uint8Array | undefined;
        vertices?: ({
            hash?: string | undefined;
            nodeId?: string | undefined;
            operation?: {
                type?: string | undefined;
                value?: any | undefined;
            } | undefined;
            dependencies?: string[] | undefined;
        }[] & ({
            hash?: string | undefined;
            nodeId?: string | undefined;
            operation?: {
                type?: string | undefined;
                value?: any | undefined;
            } | undefined;
            dependencies?: string[] | undefined;
        } & {
            hash?: string | undefined;
            nodeId?: string | undefined;
            operation?: ({
                type?: string | undefined;
                value?: any | undefined;
            } & {
                type?: string | undefined;
                value?: any | undefined;
            } & { [K in Exclude<keyof I["vertices"][number]["operation"], keyof Vertex_Operation>]: never; }) | undefined;
            dependencies?: (string[] & string[] & { [K_1 in Exclude<keyof I["vertices"][number]["dependencies"], keyof string[]>]: never; }) | undefined;
        } & { [K_2 in Exclude<keyof I["vertices"][number], keyof Vertex>]: never; })[] & { [K_3 in Exclude<keyof I["vertices"], keyof {
            hash?: string | undefined;
            nodeId?: string | undefined;
            operation?: {
                type?: string | undefined;
                value?: any | undefined;
            } | undefined;
            dependencies?: string[] | undefined;
        }[]>]: never; }) | undefined;
    } & { [K_4 in Exclude<keyof I, keyof TopologyObjectBase>]: never; }>(base?: I | undefined): TopologyObjectBase;
    fromPartial<I_1 extends {
        id?: string | undefined;
        abi?: string | undefined;
        bytecode?: Uint8Array | undefined;
        vertices?: {
            hash?: string | undefined;
            nodeId?: string | undefined;
            operation?: {
                type?: string | undefined;
                value?: any | undefined;
            } | undefined;
            dependencies?: string[] | undefined;
        }[] | undefined;
    } & {
        id?: string | undefined;
        abi?: string | undefined;
        bytecode?: Uint8Array | undefined;
        vertices?: ({
            hash?: string | undefined;
            nodeId?: string | undefined;
            operation?: {
                type?: string | undefined;
                value?: any | undefined;
            } | undefined;
            dependencies?: string[] | undefined;
        }[] & ({
            hash?: string | undefined;
            nodeId?: string | undefined;
            operation?: {
                type?: string | undefined;
                value?: any | undefined;
            } | undefined;
            dependencies?: string[] | undefined;
        } & {
            hash?: string | undefined;
            nodeId?: string | undefined;
            operation?: ({
                type?: string | undefined;
                value?: any | undefined;
            } & {
                type?: string | undefined;
                value?: any | undefined;
            } & { [K_5 in Exclude<keyof I_1["vertices"][number]["operation"], keyof Vertex_Operation>]: never; }) | undefined;
            dependencies?: (string[] & string[] & { [K_6 in Exclude<keyof I_1["vertices"][number]["dependencies"], keyof string[]>]: never; }) | undefined;
        } & { [K_7 in Exclude<keyof I_1["vertices"][number], keyof Vertex>]: never; })[] & { [K_8 in Exclude<keyof I_1["vertices"], keyof {
            hash?: string | undefined;
            nodeId?: string | undefined;
            operation?: {
                type?: string | undefined;
                value?: any | undefined;
            } | undefined;
            dependencies?: string[] | undefined;
        }[]>]: never; }) | undefined;
    } & { [K_9 in Exclude<keyof I_1, keyof TopologyObjectBase>]: never; }>(object: I_1): TopologyObjectBase;
};
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P : P & {
    [K in keyof P]: Exact<P[K], I[K]>;
} & {
    [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
};
export {};
//# sourceMappingURL=object_pb.d.ts.map