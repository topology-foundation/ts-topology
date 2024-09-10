// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.0.3
//   protoc               unknown
// source: network/src/proto/messages.proto

/* eslint-disable */
import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { Value } from "./struct_pb.js";

export const protobufPackage = "topology.network";

/** Supposed to be the RIBLT stuff */
export interface Vertex {
  hash: string;
  nodeId: string;
  operation: Vertex_Operation | undefined;
  dependencies: string[];
}

export interface Vertex_Operation {
  type: string;
  value: any[];
}

export interface Message {
  sender: string;
  type: Message_MessageType;
  data: Uint8Array;
}

export enum Message_MessageType {
  UPDATE = 0,
  SYNC = 1,
  SYNC_ACCEPT = 2,
  SYNC_REJECT = 3,
  CUSTOM = 4,
  UNRECOGNIZED = -1,
}

export function message_MessageTypeFromJSON(object: any): Message_MessageType {
  switch (object) {
    case 0:
    case "UPDATE":
      return Message_MessageType.UPDATE;
    case 1:
    case "SYNC":
      return Message_MessageType.SYNC;
    case 2:
    case "SYNC_ACCEPT":
      return Message_MessageType.SYNC_ACCEPT;
    case 3:
    case "SYNC_REJECT":
      return Message_MessageType.SYNC_REJECT;
    case 4:
    case "CUSTOM":
      return Message_MessageType.CUSTOM;
    case -1:
    case "UNRECOGNIZED":
    default:
      return Message_MessageType.UNRECOGNIZED;
  }
}

export function message_MessageTypeToJSON(object: Message_MessageType): string {
  switch (object) {
    case Message_MessageType.UPDATE:
      return "UPDATE";
    case Message_MessageType.SYNC:
      return "SYNC";
    case Message_MessageType.SYNC_ACCEPT:
      return "SYNC_ACCEPT";
    case Message_MessageType.SYNC_REJECT:
      return "SYNC_REJECT";
    case Message_MessageType.CUSTOM:
      return "CUSTOM";
    case Message_MessageType.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

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
  diff: Vertex[];
  missing: string[];
}

export interface SyncReject {
}

function createBaseVertex(): Vertex {
  return { hash: "", nodeId: "", operation: undefined, dependencies: [] };
}

export const Vertex = {
  encode(message: Vertex, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.hash !== "") {
      writer.uint32(10).string(message.hash);
    }
    if (message.nodeId !== "") {
      writer.uint32(18).string(message.nodeId);
    }
    if (message.operation !== undefined) {
      Vertex_Operation.encode(message.operation, writer.uint32(26).fork()).join();
    }
    for (const v of message.dependencies) {
      writer.uint32(34).string(v!);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): Vertex {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVertex();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.hash = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.nodeId = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.operation = Vertex_Operation.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.dependencies.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Vertex {
    return {
      hash: isSet(object.hash) ? globalThis.String(object.hash) : "",
      nodeId: isSet(object.nodeId) ? globalThis.String(object.nodeId) : "",
      operation: isSet(object.operation) ? Vertex_Operation.fromJSON(object.operation) : undefined,
      dependencies: globalThis.Array.isArray(object?.dependencies)
        ? object.dependencies.map((e: any) => globalThis.String(e))
        : [],
    };
  },

  toJSON(message: Vertex): unknown {
    const obj: any = {};
    if (message.hash !== "") {
      obj.hash = message.hash;
    }
    if (message.nodeId !== "") {
      obj.nodeId = message.nodeId;
    }
    if (message.operation !== undefined) {
      obj.operation = Vertex_Operation.toJSON(message.operation);
    }
    if (message.dependencies?.length) {
      obj.dependencies = message.dependencies;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Vertex>, I>>(base?: I): Vertex {
    return Vertex.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Vertex>, I>>(object: I): Vertex {
    const message = createBaseVertex();
    message.hash = object.hash ?? "";
    message.nodeId = object.nodeId ?? "";
    message.operation = (object.operation !== undefined && object.operation !== null)
      ? Vertex_Operation.fromPartial(object.operation)
      : undefined;
    message.dependencies = object.dependencies?.map((e) => e) || [];
    return message;
  },
};

function createBaseVertex_Operation(): Vertex_Operation {
  return { type: "", value: [] };
}

export const Vertex_Operation = {
  encode(message: Vertex_Operation, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    for (const v of message.value) {
      Value.encode(Value.wrap(v!), writer.uint32(18).fork()).join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): Vertex_Operation {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVertex_Operation();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.value.push(Value.unwrap(Value.decode(reader, reader.uint32())));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Vertex_Operation {
    return {
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      value: globalThis.Array.isArray(object?.value) ? [...object.value] : [],
    };
  },

  toJSON(message: Vertex_Operation): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.value?.length) {
      obj.value = message.value;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Vertex_Operation>, I>>(base?: I): Vertex_Operation {
    return Vertex_Operation.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Vertex_Operation>, I>>(object: I): Vertex_Operation {
    const message = createBaseVertex_Operation();
    message.type = object.type ?? "";
    message.value = object.value?.map((e) => e) || [];
    return message;
  },
};

function createBaseMessage(): Message {
  return { sender: "", type: 0, data: new Uint8Array(0) };
}

export const Message = {
  encode(message: Message, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.sender !== "") {
      writer.uint32(10).string(message.sender);
    }
    if (message.type !== 0) {
      writer.uint32(16).int32(message.type);
    }
    if (message.data.length !== 0) {
      writer.uint32(26).bytes(message.data);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): Message {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.sender = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.type = reader.int32() as any;
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.data = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Message {
    return {
      sender: isSet(object.sender) ? globalThis.String(object.sender) : "",
      type: isSet(object.type) ? message_MessageTypeFromJSON(object.type) : 0,
      data: isSet(object.data) ? bytesFromBase64(object.data) : new Uint8Array(0),
    };
  },

  toJSON(message: Message): unknown {
    const obj: any = {};
    if (message.sender !== "") {
      obj.sender = message.sender;
    }
    if (message.type !== 0) {
      obj.type = message_MessageTypeToJSON(message.type);
    }
    if (message.data.length !== 0) {
      obj.data = base64FromBytes(message.data);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Message>, I>>(base?: I): Message {
    return Message.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Message>, I>>(object: I): Message {
    const message = createBaseMessage();
    message.sender = object.sender ?? "";
    message.type = object.type ?? 0;
    message.data = object.data ?? new Uint8Array(0);
    return message;
  },
};

function createBaseUpdate(): Update {
  return { objectId: "", vertices: [] };
}

export const Update = {
  encode(message: Update, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.objectId !== "") {
      writer.uint32(10).string(message.objectId);
    }
    for (const v of message.vertices) {
      Vertex.encode(v!, writer.uint32(18).fork()).join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): Update {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUpdate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.objectId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.vertices.push(Vertex.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Update {
    return {
      objectId: isSet(object.objectId) ? globalThis.String(object.objectId) : "",
      vertices: globalThis.Array.isArray(object?.vertices) ? object.vertices.map((e: any) => Vertex.fromJSON(e)) : [],
    };
  },

  toJSON(message: Update): unknown {
    const obj: any = {};
    if (message.objectId !== "") {
      obj.objectId = message.objectId;
    }
    if (message.vertices?.length) {
      obj.vertices = message.vertices.map((e) => Vertex.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Update>, I>>(base?: I): Update {
    return Update.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Update>, I>>(object: I): Update {
    const message = createBaseUpdate();
    message.objectId = object.objectId ?? "";
    message.vertices = object.vertices?.map((e) => Vertex.fromPartial(e)) || [];
    return message;
  },
};

function createBaseSync(): Sync {
  return { objectId: "", vertexHashes: [] };
}

export const Sync = {
  encode(message: Sync, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.objectId !== "") {
      writer.uint32(10).string(message.objectId);
    }
    for (const v of message.vertexHashes) {
      writer.uint32(18).string(v!);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): Sync {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSync();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.objectId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.vertexHashes.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Sync {
    return {
      objectId: isSet(object.objectId) ? globalThis.String(object.objectId) : "",
      vertexHashes: globalThis.Array.isArray(object?.vertexHashes)
        ? object.vertexHashes.map((e: any) => globalThis.String(e))
        : [],
    };
  },

  toJSON(message: Sync): unknown {
    const obj: any = {};
    if (message.objectId !== "") {
      obj.objectId = message.objectId;
    }
    if (message.vertexHashes?.length) {
      obj.vertexHashes = message.vertexHashes;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Sync>, I>>(base?: I): Sync {
    return Sync.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Sync>, I>>(object: I): Sync {
    const message = createBaseSync();
    message.objectId = object.objectId ?? "";
    message.vertexHashes = object.vertexHashes?.map((e) => e) || [];
    return message;
  },
};

function createBaseSyncAccept(): SyncAccept {
  return { objectId: "", diff: [], missing: [] };
}

export const SyncAccept = {
  encode(message: SyncAccept, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.objectId !== "") {
      writer.uint32(10).string(message.objectId);
    }
    for (const v of message.diff) {
      Vertex.encode(v!, writer.uint32(18).fork()).join();
    }
    for (const v of message.missing) {
      writer.uint32(26).string(v!);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): SyncAccept {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncAccept();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.objectId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.diff.push(Vertex.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.missing.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SyncAccept {
    return {
      objectId: isSet(object.objectId) ? globalThis.String(object.objectId) : "",
      diff: globalThis.Array.isArray(object?.diff) ? object.diff.map((e: any) => Vertex.fromJSON(e)) : [],
      missing: globalThis.Array.isArray(object?.missing) ? object.missing.map((e: any) => globalThis.String(e)) : [],
    };
  },

  toJSON(message: SyncAccept): unknown {
    const obj: any = {};
    if (message.objectId !== "") {
      obj.objectId = message.objectId;
    }
    if (message.diff?.length) {
      obj.diff = message.diff.map((e) => Vertex.toJSON(e));
    }
    if (message.missing?.length) {
      obj.missing = message.missing;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SyncAccept>, I>>(base?: I): SyncAccept {
    return SyncAccept.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<SyncAccept>, I>>(object: I): SyncAccept {
    const message = createBaseSyncAccept();
    message.objectId = object.objectId ?? "";
    message.diff = object.diff?.map((e) => Vertex.fromPartial(e)) || [];
    message.missing = object.missing?.map((e) => e) || [];
    return message;
  },
};

function createBaseSyncReject(): SyncReject {
  return {};
}

export const SyncReject = {
  encode(_: SyncReject, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): SyncReject {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncReject();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): SyncReject {
    return {};
  },

  toJSON(_: SyncReject): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<SyncReject>, I>>(base?: I): SyncReject {
    return SyncReject.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<SyncReject>, I>>(_: I): SyncReject {
    const message = createBaseSyncReject();
    return message;
  },
};

function bytesFromBase64(b64: string): Uint8Array {
  if ((globalThis as any).Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if ((globalThis as any).Buffer) {
    return globalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(globalThis.String.fromCharCode(byte));
    });
    return globalThis.btoa(bin.join(""));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
