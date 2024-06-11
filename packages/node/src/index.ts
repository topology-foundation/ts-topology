import {
  TopologyNetworkNode,
  TopologyNetworkNodeConfig,
  streamToString,
  stringToStream,
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

      const message = JSON.parse(new TextDecoder().decode(e.detail.data));

      console.log(e.detail.topic, message);
    });

    this._networkNode.addMessageHandler(
      ["/topology/message/0.0.1"],
      async ({ stream }) => {
        let input = await streamToString(stream);
        if (!input) return;

        const message = JSON.parse(input);
        switch (message["type"]) {
          case "object_fetch": {
            const objectId = uint8ArrayToString(message["data"]);
            const object = await this.getObject(objectId);
            const object_message = `{
              type: "object",
              data: ${uint8ArrayFromString(JSON.stringify(object))}
            }`;
            stringToStream(stream, object_message);
            break;
          }
          case "object": {
            const object: TopologyObject = JSON.parse(
              uint8ArrayToString(message["data"]),
            );
            this._objectStore.put(object.getObjectId(), object);
          }
          default: {
            return;
          }
        }
      },
    );
  }

  createObject(object: TopologyObject) {
    object.init();
    const objectId = object.getObjectId();
    this._networkNode.subscribe(objectId);
    this._objectStore.put(objectId, object);
  }

  /// Subscribe to the object's PubSub group
  /// and fetch it from a peer
  async subscribeObject(objectId: string) {
    this._networkNode.subscribe(objectId);
    const message = `{
      type: "object_fetch",
      data: ${uint8ArrayFromString(objectId)}
    }`;

    await this._networkNode.sendMessageRandomTopicPeer(
      objectId,
      ["/topology/message/0.0.1"],
      message,
    );
  }

  /// Get the object from the local Object Store
  async getObject(objectId: string) {
    return this._objectStore.get(objectId);
  }

  sendObjectUpdate(objectId: string) {
    // not dialed, emitted through pubsub
    const message = `{
      type: "object_update",
      data: []
    }`;
    this._networkNode.broadcastMessage(objectId, uint8ArrayFromString(message));
  }
}
