import type { Stream } from "@libp2p/interface";
import type { ObjectPb, TopologyObject } from "@topology-foundation/object";
import type { TopologyNode } from "./index.js";
export declare function topologyMessagesHandler(node: TopologyNode, stream?: Stream, data?: Uint8Array): Promise<void>;
export declare function topologyObjectChangesHandler(node: TopologyNode, obj: TopologyObject, originFn: string, vertices: ObjectPb.Vertex[]): void;
//# sourceMappingURL=handlers.d.ts.map