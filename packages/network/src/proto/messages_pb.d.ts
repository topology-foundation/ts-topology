import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "topology.network";
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
export interface Message {
    sender: string;
    type: Message_MessageType;
    data: Uint8Array;
}
export declare enum Message_MessageType {
    UPDATE = 0,
    SYNC = 1,
    SYNC_ACCEPT = 2,
    SYNC_REJECT = 3,
    CUSTOM = 4,
    UNRECOGNIZED = -1
}
export declare function message_MessageTypeFromJSON(object: any): Message_MessageType;
export declare function message_MessageTypeToJSON(object: Message_MessageType): string;
export interface Update {
    objectId: string;
    vertices: Vertex[];
}
export interface Sync {
    objectId: string;
    vertexHashes: string[];
}
export interface SyncAccept {
    objectId: string;
    requested: Vertex[];
    requesting: string[];
}
export interface SyncReject {
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
export declare const Message: {
    encode(message: Message, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): Message;
    fromJSON(object: any): Message;
    toJSON(message: Message): unknown;
    create<I extends {
        sender?: string | undefined;
        type?: Message_MessageType | undefined;
        data?: Uint8Array | undefined;
    } & {
        sender?: string | undefined;
        type?: Message_MessageType | undefined;
        data?: Uint8Array | undefined;
    } & { [K in Exclude<keyof I, keyof Message>]: never; }>(base?: I | undefined): Message;
    fromPartial<I_1 extends {
        sender?: string | undefined;
        type?: Message_MessageType | undefined;
        data?: Uint8Array | undefined;
    } & {
        sender?: string | undefined;
        type?: Message_MessageType | undefined;
        data?: Uint8Array | undefined;
    } & { [K_1 in Exclude<keyof I_1, keyof Message>]: never; }>(object: I_1): Message;
};
export declare const Update: {
    encode(message: Update, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): Update;
    fromJSON(object: any): Update;
    toJSON(message: Update): unknown;
    create<I extends {
        objectId?: string | undefined;
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
        objectId?: string | undefined;
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
    } & { [K_4 in Exclude<keyof I, keyof Update>]: never; }>(base?: I | undefined): Update;
    fromPartial<I_1 extends {
        objectId?: string | undefined;
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
        objectId?: string | undefined;
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
    } & { [K_9 in Exclude<keyof I_1, keyof Update>]: never; }>(object: I_1): Update;
};
export declare const Sync: {
    encode(message: Sync, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): Sync;
    fromJSON(object: any): Sync;
    toJSON(message: Sync): unknown;
    create<I extends {
        objectId?: string | undefined;
        vertexHashes?: string[] | undefined;
    } & {
        objectId?: string | undefined;
        vertexHashes?: (string[] & string[] & { [K in Exclude<keyof I["vertexHashes"], keyof string[]>]: never; }) | undefined;
    } & { [K_1 in Exclude<keyof I, keyof Sync>]: never; }>(base?: I | undefined): Sync;
    fromPartial<I_1 extends {
        objectId?: string | undefined;
        vertexHashes?: string[] | undefined;
    } & {
        objectId?: string | undefined;
        vertexHashes?: (string[] & string[] & { [K_2 in Exclude<keyof I_1["vertexHashes"], keyof string[]>]: never; }) | undefined;
    } & { [K_3 in Exclude<keyof I_1, keyof Sync>]: never; }>(object: I_1): Sync;
};
export declare const SyncAccept: {
    encode(message: SyncAccept, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): SyncAccept;
    fromJSON(object: any): SyncAccept;
    toJSON(message: SyncAccept): unknown;
    create<I extends {
        objectId?: string | undefined;
        requested?: {
            hash?: string | undefined;
            nodeId?: string | undefined;
            operation?: {
                type?: string | undefined;
                value?: any | undefined;
            } | undefined;
            dependencies?: string[] | undefined;
        }[] | undefined;
        requesting?: string[] | undefined;
    } & {
        objectId?: string | undefined;
        requested?: ({
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
            } & { [K in Exclude<keyof I["requested"][number]["operation"], keyof Vertex_Operation>]: never; }) | undefined;
            dependencies?: (string[] & string[] & { [K_1 in Exclude<keyof I["requested"][number]["dependencies"], keyof string[]>]: never; }) | undefined;
        } & { [K_2 in Exclude<keyof I["requested"][number], keyof Vertex>]: never; })[] & { [K_3 in Exclude<keyof I["requested"], keyof {
            hash?: string | undefined;
            nodeId?: string | undefined;
            operation?: {
                type?: string | undefined;
                value?: any | undefined;
            } | undefined;
            dependencies?: string[] | undefined;
        }[]>]: never; }) | undefined;
        requesting?: (string[] & string[] & { [K_4 in Exclude<keyof I["requesting"], keyof string[]>]: never; }) | undefined;
    } & { [K_5 in Exclude<keyof I, keyof SyncAccept>]: never; }>(base?: I | undefined): SyncAccept;
    fromPartial<I_1 extends {
        objectId?: string | undefined;
        requested?: {
            hash?: string | undefined;
            nodeId?: string | undefined;
            operation?: {
                type?: string | undefined;
                value?: any | undefined;
            } | undefined;
            dependencies?: string[] | undefined;
        }[] | undefined;
        requesting?: string[] | undefined;
    } & {
        objectId?: string | undefined;
        requested?: ({
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
            } & { [K_6 in Exclude<keyof I_1["requested"][number]["operation"], keyof Vertex_Operation>]: never; }) | undefined;
            dependencies?: (string[] & string[] & { [K_7 in Exclude<keyof I_1["requested"][number]["dependencies"], keyof string[]>]: never; }) | undefined;
        } & { [K_8 in Exclude<keyof I_1["requested"][number], keyof Vertex>]: never; })[] & { [K_9 in Exclude<keyof I_1["requested"], keyof {
            hash?: string | undefined;
            nodeId?: string | undefined;
            operation?: {
                type?: string | undefined;
                value?: any | undefined;
            } | undefined;
            dependencies?: string[] | undefined;
        }[]>]: never; }) | undefined;
        requesting?: (string[] & string[] & { [K_10 in Exclude<keyof I_1["requesting"], keyof string[]>]: never; }) | undefined;
    } & { [K_11 in Exclude<keyof I_1, keyof SyncAccept>]: never; }>(object: I_1): SyncAccept;
};
export declare const SyncReject: {
    encode(_: SyncReject, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): SyncReject;
    fromJSON(_: any): SyncReject;
    toJSON(_: SyncReject): unknown;
    create<I extends {} & {} & { [K in Exclude<keyof I, never>]: never; }>(base?: I | undefined): SyncReject;
    fromPartial<I_1 extends {} & {} & { [K_1 in Exclude<keyof I_1, never>]: never; }>(_: I_1): SyncReject;
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
//# sourceMappingURL=messages_pb.d.ts.map