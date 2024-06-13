import {
  TopologyNetworkNode,
  TopologyNetworkNodeConfig,
  streamToString,
} from "@topologygg/network";
import { TopologyObject } from "@topologygg/object";
import { TopologyObjectStore } from "./store";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";

export interface TopologyNodeConfig {
  networkConfig?: TopologyNetworkNodeConfig;
}

export class TopologyNode {
  private _config?: TopologyNodeConfig;
  private _networkNode: TopologyNetworkNode;
  private _objectStore: TopologyObjectStore;

  constructor(config?: TopologyNodeConfig) {
    this._config = config;
    this._networkNode = new TopologyNetworkNode(config?.networkConfig);
    this._objectStore = new TopologyObjectStore();
  }

  async start(): Promise<void> {
    await this._networkNode.start();

    this._networkNode.addPubsubEventListener("message", (e) => {
      if (e.detail.topic === "_peer-discovery._p2p._pubsub") return;

      // send the events to the app handler
      // const message = JSON.parse(new TextDecoder().decode(e.detail.data));
    });

    this._networkNode.addMessageHandler(
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
              "data": [${uint8ArrayFromString(JSON.stringify(object))}]
            }`;
            await this._networkNode.sendMessage(
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
          }
          default: {
            return;
          }
        }
      },
    );
  }

  getPeerId() {
    return this._networkNode.peerId;
  }

  createObject(object: TopologyObject) {
    const objectId = object.getObjectId();
    this._networkNode.subscribe(objectId);
    this._objectStore.put(objectId, object);
  }

  /// Subscribe to the object's PubSub group
  /// and fetch it from a peer
  async subscribeObject(objectId: string) {
    this._networkNode.subscribe(objectId);
    const message = `{
      "type": "object_fetch",
      "sender": "${this._networkNode.peerId}",
      "data": [${uint8ArrayFromString(objectId)}]
    }`;

    await this._networkNode.sendMessageRandomTopicPeer(
      objectId,
      ["/topology/message/0.0.1"],
      message,
    );
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
    this._networkNode.broadcastMessage(
      object.getObjectId(),
      uint8ArrayFromString(message),
    );
  }
}
