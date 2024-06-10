import {
  TopologyNetworkNode,
  TopologyNetworkNodeConfig,
} from "@topologygg/network";
import { TopologyObject } from "@topologygg/object";
import { TopologyObjectStore } from "./store";

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
  }

  createObject(object: TopologyObject) {
    object.init();
    const objectId = object.getObjectId();
    this._networkNode.subscribe(objectId);
    this._objectStore.put(objectId, object);
  }

  /// TODO: separate fetching the object from the network and fetching from the objectStore
  async getObject(objectId: string) {
    this._networkNode.subscribe(objectId);
    let object = this._objectStore.get(objectId);
    if (!object) {
      // TODO reimplement the logic to use direct connection + protobufs
      // {
      //   type: "{fetch_object|object|custom}"
      //   data: "......"
      // }

      const message = "fetch_object";
      await this._networkNode.sendMessage(
        objectId,
        ["/topology/message/0.0.1"],
        message,
      );
    }

    return object;
  }

  sendObjectUpdate(objectId: string) {
    const message = "object_update";
    this._networkNode.sendMessage(objectId, [], message);
  }
}
