import { GossipsubMessage } from "@chainsafe/libp2p-gossipsub";
import { EventHandler, StreamHandler } from "@libp2p/interface";
import {
  Message,
  Message_MessageType,
  TopologyNetworkNode,
  TopologyNetworkNodeConfig,
  streamToString,
} from "@topology-foundation/network";
import { TopologyObject } from "@topology-foundation/object";
import { TopologyObjectStore } from "./store";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import * as lp from "it-length-prefixed";
import { topologyMessagesHandler } from "./handlers";

export * from "./operations.js";

// snake_casing to match the JSON config
export interface TopologyNodeConfig {
  network_config?: TopologyNetworkNodeConfig;
}

export class TopologyNode {
  private _config?: TopologyNodeConfig;

  objectStore: TopologyObjectStore;
  networkNode: TopologyNetworkNode;

  constructor(config?: TopologyNodeConfig) {
    this._config = config;
    this.networkNode = new TopologyNetworkNode(config?.network_config);
    this.objectStore = new TopologyObjectStore();
  }

  async start(): Promise<void> {
    await this.networkNode.start();

    this.networkNode.addMessageHandler(
      ["/topology/message/0.0.1"],
      async ({ stream }) => topologyMessagesHandler(this, stream)
    );
  }

  addCustomGroup(group: string) {
    this.networkNode.subscribe(group);
  }

  addCustomGroupMessageHandler(
    group: string,
    handler: EventHandler<CustomEvent<GossipsubMessage>>,
  ) {
    this.networkNode.addGroupMessageHandler(handler);
  }

  sendGroupMessage(group: string, data: Uint8Array) {
    const message = Message.create({
      sender: this.networkNode.peerId,
      type: Message_MessageType.CUSTOM,
      data,
    })
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
}
