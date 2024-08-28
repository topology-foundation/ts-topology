// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.0.3
//   protoc               unknown
// source: proto/messages.proto

/* eslint-disable */
import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";

export const protobufPackage = "topology.network";

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
