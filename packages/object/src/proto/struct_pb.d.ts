import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "google.protobuf";
/**
 * `NullValue` is a singleton enumeration to represent the null value for the
 * `Value` type union.
 *
 * The JSON representation for `NullValue` is JSON `null`.
 */
export declare enum NullValue {
    /** NULL_VALUE - Null value. */
    NULL_VALUE = 0,
    UNRECOGNIZED = -1
}
export declare function nullValueFromJSON(object: any): NullValue;
export declare function nullValueToJSON(object: NullValue): string;
/**
 * `Struct` represents a structured data value, consisting of fields
 * which map to dynamically typed values. In some languages, `Struct`
 * might be supported by a native representation. For example, in
 * scripting languages like JS a struct is represented as an
 * object. The details of that representation are described together
 * with the proto support for the language.
 *
 * The JSON representation for `Struct` is JSON object.
 */
export interface Struct {
    /** Unordered map of dynamically typed values. */
    fields: {
        [key: string]: any | undefined;
    };
}
export interface Struct_FieldsEntry {
    key: string;
    value: any | undefined;
}
/**
 * `Value` represents a dynamically typed value which can be either
 * null, a number, a string, a boolean, a recursive struct value, or a
 * list of values. A producer of value is expected to set one of these
 * variants. Absence of any variant indicates an error.
 *
 * The JSON representation for `Value` is JSON value.
 */
export interface Value {
    /** Represents a null value. */
    nullValue?: NullValue | undefined;
    /** Represents a double value. */
    numberValue?: number | undefined;
    /** Represents a string value. */
    stringValue?: string | undefined;
    /** Represents a boolean value. */
    boolValue?: boolean | undefined;
    /** Represents a structured value. */
    structValue?: {
        [key: string]: any;
    } | undefined;
    /** Represents a repeated `Value`. */
    listValue?: Array<any> | undefined;
}
/**
 * `ListValue` is a wrapper around a repeated field of values.
 *
 * The JSON representation for `ListValue` is JSON array.
 */
export interface ListValue {
    /** Repeated field of dynamically typed values. */
    values: any[];
}
export declare const Struct: {
    encode(message: Struct, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): Struct;
    fromJSON(object: any): Struct;
    toJSON(message: Struct): unknown;
    create<I extends {
        fields?: {
            [x: string]: any;
        } | undefined;
    } & {
        fields?: ({
            [x: string]: any;
        } & {
            [x: string]: any;
        } & { [K in Exclude<keyof I["fields"], string | number>]: never; }) | undefined;
    } & { [K_1 in Exclude<keyof I, "fields">]: never; }>(base?: I | undefined): Struct;
    fromPartial<I_1 extends {
        fields?: {
            [x: string]: any;
        } | undefined;
    } & {
        fields?: ({
            [x: string]: any;
        } & {
            [x: string]: any;
        } & { [K_2 in Exclude<keyof I_1["fields"], string | number>]: never; }) | undefined;
    } & { [K_3 in Exclude<keyof I_1, "fields">]: never; }>(object: I_1): Struct;
    wrap(object: {
        [key: string]: any;
    } | undefined): Struct;
    unwrap(message: Struct): {
        [key: string]: any;
    };
};
export declare const Struct_FieldsEntry: {
    encode(message: Struct_FieldsEntry, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): Struct_FieldsEntry;
    fromJSON(object: any): Struct_FieldsEntry;
    toJSON(message: Struct_FieldsEntry): unknown;
    create<I extends {
        key?: string | undefined;
        value?: any | undefined;
    } & {
        key?: string | undefined;
        value?: any | undefined;
    } & { [K in Exclude<keyof I, keyof Struct_FieldsEntry>]: never; }>(base?: I | undefined): Struct_FieldsEntry;
    fromPartial<I_1 extends {
        key?: string | undefined;
        value?: any | undefined;
    } & {
        key?: string | undefined;
        value?: any | undefined;
    } & { [K_1 in Exclude<keyof I_1, keyof Struct_FieldsEntry>]: never; }>(object: I_1): Struct_FieldsEntry;
};
export declare const Value: {
    encode(message: Value, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): Value;
    fromJSON(object: any): Value;
    toJSON(message: Value): unknown;
    create<I extends {
        nullValue?: NullValue | undefined;
        numberValue?: number | undefined;
        stringValue?: string | undefined;
        boolValue?: boolean | undefined;
        structValue?: {
            [x: string]: any;
        } | undefined;
        listValue?: any[] | undefined;
    } & {
        nullValue?: NullValue | undefined;
        numberValue?: number | undefined;
        stringValue?: string | undefined;
        boolValue?: boolean | undefined;
        structValue?: ({
            [x: string]: any;
        } & {
            [x: string]: any;
        } & { [K in Exclude<keyof I["structValue"], string | number>]: never; }) | undefined;
        listValue?: (any[] & any[] & { [K_1 in Exclude<keyof I["listValue"], keyof any[]>]: never; }) | undefined;
    } & { [K_2 in Exclude<keyof I, keyof Value>]: never; }>(base?: I | undefined): Value;
    fromPartial<I_1 extends {
        nullValue?: NullValue | undefined;
        numberValue?: number | undefined;
        stringValue?: string | undefined;
        boolValue?: boolean | undefined;
        structValue?: {
            [x: string]: any;
        } | undefined;
        listValue?: any[] | undefined;
    } & {
        nullValue?: NullValue | undefined;
        numberValue?: number | undefined;
        stringValue?: string | undefined;
        boolValue?: boolean | undefined;
        structValue?: ({
            [x: string]: any;
        } & {
            [x: string]: any;
        } & { [K_3 in Exclude<keyof I_1["structValue"], string | number>]: never; }) | undefined;
        listValue?: (any[] & any[] & { [K_4 in Exclude<keyof I_1["listValue"], keyof any[]>]: never; }) | undefined;
    } & { [K_5 in Exclude<keyof I_1, keyof Value>]: never; }>(object: I_1): Value;
    wrap(value: any): Value;
    unwrap(message: any): string | number | boolean | Object | null | Array<any> | undefined;
};
export declare const ListValue: {
    encode(message: ListValue, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): ListValue;
    fromJSON(object: any): ListValue;
    toJSON(message: ListValue): unknown;
    create<I extends {
        values?: any[] | undefined;
    } & {
        values?: (any[] & any[] & { [K in Exclude<keyof I["values"], keyof any[]>]: never; }) | undefined;
    } & { [K_1 in Exclude<keyof I, "values">]: never; }>(base?: I | undefined): ListValue;
    fromPartial<I_1 extends {
        values?: any[] | undefined;
    } & {
        values?: (any[] & any[] & { [K_2 in Exclude<keyof I_1["values"], keyof any[]>]: never; }) | undefined;
    } & { [K_3 in Exclude<keyof I_1, "values">]: never; }>(object: I_1): ListValue;
    wrap(array: Array<any> | undefined): ListValue;
    unwrap(message: ListValue): Array<any>;
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
//# sourceMappingURL=struct_pb.d.ts.map