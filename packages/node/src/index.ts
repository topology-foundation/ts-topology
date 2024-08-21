import { GossipsubMessage } from "@chainsafe/libp2p-gossipsub";
import { EventHandler, StreamHandler } from "@libp2p/interface";
import {
  Message,
  Message_MessageType,
  TopologyNetworkNode,
  TopologyNetworkNodeConfig,
} from "@topology-foundation/network";
import { TopologyObjectStore } from "./store/index.js";
import { topologyMessagesHandler } from "./handlers.js";
import { OPERATIONS, executeObjectOperation } from "./operations.js";
import { TopologyObject } from "@topology-foundation/object";

import * as crypto from "crypto";
export * from "./operations.js";

// snake_casing to match the JSON config
export interface TopologyNodeConfig {
  network_config?: TopologyNetworkNodeConfig;
}

export class TopologyNode {
  config?: TopologyNodeConfig;
  objectStore: TopologyObjectStore;
  networkNode: TopologyNetworkNode;

  constructor(config?: TopologyNodeConfig) {
    this.config = config;
    this.networkNode = new TopologyNetworkNode(config?.network_config);
    this.objectStore = new TopologyObjectStore();
  }

  async start(): Promise<void> {
    await this.networkNode.start();

    this.networkNode.addMessageHandler(
      ["/topology/message/0.0.1"],
      async ({ stream }) => topologyMessagesHandler(this, stream),
    );
  }

  addCustomGroup(group: string) {
    this.networkNode.subscribe(group);
  }

  addCustomGroupMessageHandler(
    group: string,
    handler: EventHandler<CustomEvent<GossipsubMessage>>,
  ) {
    // TODO: ignore if messages are not from the group
    this.networkNode.addGroupMessageHandler(group, handler);
  }

  sendGroupMessage(group: string, data: Uint8Array) {
    const message = Message.create({
      sender: this.networkNode.peerId,
      type: Message_MessageType.CUSTOM,
      data,
    });
    this.networkNode.broadcastMessage(group, message);
  }

  addCustomMessageHandler(protocol: string | string[], handler: StreamHandler) {
    this.networkNode.addMessageHandler(protocol, handler);
  }

  sendCustomMessage(peerId: string, protocol: string, data: Uint8Array) {
    const message = Message.create({
      sender: this.networkNode.peerId,
      type: Message_MessageType.CUSTOM,
      data,
    });
    this.networkNode.sendMessage(peerId, [protocol], message);
  }

  createObject(id: string, abi?: string, bytecode?: Uint8Array) {
    const object = TopologyObject.create({
      id,
      abi,
      bytecode,
    });
    executeObjectOperation(
      this,
      OPERATIONS.CREATE,
      TopologyObject.encode(object).finish(),
    );
  }

  updateObject(id: string, operations: { fn: string; args: string[] }[]) {
    const object = TopologyObject.create({
      id,
      operations: operations.map((op) => {
        return {
          nonce: generateNonce(op.fn, op.args),
          fn: op.fn,
          args: op.args,
        };
      }),
    });
    executeObjectOperation(
      this,
      OPERATIONS.UPDATE,
      TopologyObject.encode(object).finish(),
    );
  }

  async subscribeObject(id: string, fetch?: boolean, peerId?: string) {
    const object = TopologyObject.create({
      id,
    });
    executeObjectOperation(
      this,
      OPERATIONS.SUBSCRIBE,
      TopologyObject.encode(object).finish(),
      fetch,
      peerId,
    );
  }

  unsubscribeObject(id: string, purge?: boolean) {
    const object = TopologyObject.create({
      id,
    });
    executeObjectOperation(
      this,
      OPERATIONS.UNSUBSCRIBE,
      TopologyObject.encode(object).finish(),
      purge,
    );
  }

  async syncObject(
    id: string,
    operations: { nonce: string; fn: string; args: string[] }[],
    peerId?: string,
  ) {
    const object = TopologyObject.create({
      id,
      operations,
    });
    executeObjectOperation(
      this,
      OPERATIONS.SYNC,
      TopologyObject.encode(object).finish(),
      peerId,
    );
  }
}

function generateNonce(fn: string, args: string[]) {
  return crypto
    .createHash("sha256")
    .update(fn)
    .update(args.join(","))
    .update(Math.floor(Math.random() * Number.MAX_VALUE).toString())
    .digest("hex");
}
