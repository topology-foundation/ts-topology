import { GossipsubMessage } from "@chainsafe/libp2p-gossipsub";
import { EventHandler, StreamHandler } from "@libp2p/interface";
import {
  TopologyNetworkNode,
  TopologyNetworkNodeConfig,
  streamToString,
} from "@topology-foundation/network";
import { TopologyObject } from "@topology-foundation/object";
import { TopologyObjectStore, TopologyObjectStoreCallback } from "./store";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { OPERATIONS } from "./operations.js";

export * from "./operations.js";

// snake_casing to match the JSON config
export interface TopologyNodeConfig {
  network_config?: TopologyNetworkNodeConfig;
}

export class TopologyNode {
  private _config?: TopologyNodeConfig;
  private _objectStore: TopologyObjectStore;

  networkNode: TopologyNetworkNode;

  constructor(config?: TopologyNodeConfig) {
    this._config = config;
    this.networkNode = new TopologyNetworkNode(config?.network_config);
    this._objectStore = new TopologyObjectStore();
  }

  async start(): Promise<void> {
    await this.networkNode.start();

    this.networkNode.addMessageHandler(
      ["/topology/message/0.0.1"],
      async ({ stream }) => {
        let input = await streamToString(stream);
        if (!input) return;

        const message = JSON.parse(input);
        switch (message["type"]) {
          case "object_fetch": {
            const objectId = uint8ArrayToString(
              new Uint8Array(message["data"]),
            );
            const object = <TopologyObject>this.getObject(objectId);
            const object_message = `{
              "type": "object",
              "data": [${uint8ArrayFromString(JSON.stringify(object, (_key, value) => (value instanceof Set ? [...value] : value)))}]
            }`;
            await this.networkNode.sendMessage(
              message["sender"],
              [<string>stream.protocol],
              object_message,
            );
            // await stringToStream(stream, object_message);
            break;
          }
          case "object": {
            const object = JSON.parse(
              uint8ArrayToString(new Uint8Array(message["data"])),
            );
            this._objectStore.put(object["id"], object);
            break;
          }
          case "object_sync": {
            const objectId = uint8ArrayToString(
              new Uint8Array(message["data"]),
            );
            const object = <TopologyObject>this.getObject(objectId);
            const object_message = `{
              "type": "object_merge",
              "data": [${uint8ArrayFromString(JSON.stringify(object))}]
            }`;
            await this.networkNode.sendMessage(
              message["sender"],
              [<string>stream.protocol],
              object_message,
            );
            break;
          }
          case "object_merge": {
            const object = JSON.parse(
              uint8ArrayToString(new Uint8Array(message["data"])),
            );
            const local = this._objectStore.get(object["id"]);
            if (local) {
              local.merge(object);
              this._objectStore.put(object["id"], local);
            }
            break;
          }
          default: {
            return;
          }
        }
      },
    );
  }

  createObject(object: TopologyObject) {
    const objectId = object.getObjectId();
    this.networkNode.subscribe(objectId);
    this._objectStore.put(objectId, object);
  }

  /// Subscribe to the object's PubSub group
  /// and fetch it from a peer
  async subscribeObject(objectId: string, fetch = false, peerId = "", subscribionCallback?: TopologyObjectStoreCallback) {
    this.networkNode.subscribe(objectId);
    if (subscribionCallback) {
      this._objectStore.subscribe(objectId, subscribionCallback);
    }
    if (!fetch) return;
    const message = `{
      "type": "object_fetch",
      "sender": "${this.networkNode.peerId}",
      "data": [${uint8ArrayFromString(objectId)}]
    }`;

    if (!peerId) {
      await this.networkNode.sendGroupMessageRandomPeer(
        objectId,
        ["/topology/message/0.0.1"],
        message,
      );
    } else {
      await this.networkNode.sendMessage(
        peerId,
        ["/topology/message/0.0.1"],
        message,
      );
    }
  }

  async syncObject(objectId: string, peerId = "") {
    const message = `{
      "type": "object_sync",
      "sender": "${this.networkNode.peerId}",
      "data": [${uint8ArrayFromString(objectId)}]
    }`;

    if (!peerId) {
      await this.networkNode.sendGroupMessageRandomPeer(
        objectId,
        ["/topology/message/0.0.1"],
        message,
      );
    } else {
      await this.networkNode.sendMessage(
        peerId,
        ["/topology/message/0.0.1"],
        message,
      );
    }
  }

  /// Get the object from the local Object Store
  getObject(objectId: string) {
    return this._objectStore.get(objectId);
  }

  updateObject(object: TopologyObject, update_data: string) {
    this._objectStore.put(object.getObjectId(), object);
    // not dialed, emitted through pubsub
    const message = `{
      "type": "object_update",
      "data": [${uint8ArrayFromString(update_data)}]
    }`;
    this.networkNode.broadcastMessage(
      object.getObjectId(),
      uint8ArrayFromString(message),
    );
  }

  addCustomGroup(group: string) {
    this.networkNode.subscribe(group);
  }

  sendGroupMessage(group: string, message: Uint8Array) {
    this.networkNode.broadcastMessage(group, message);
  }

  addCustomGroupMessageHandler(
    handler: EventHandler<CustomEvent<GossipsubMessage>>,
  ) {
    this.networkNode.addGroupMessageHandler(handler);
  }

  addCustomMessageHandler(protocol: string | string[], handler: StreamHandler) {
    this.networkNode.addMessageHandler(protocol, handler);
  }
}
