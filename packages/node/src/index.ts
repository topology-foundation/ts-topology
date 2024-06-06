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

      const message = new TextDecoder().decode(e.detail.data);
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
      const message = new TextEncoder().encode("fetch_object");
      await this._networkNode.sendMessage(objectId, message);
    }

    return object;
  }

  sendObjectUpdate(objectId: string) {
    const message = new TextEncoder().encode("quack");
    this._networkNode.sendMessage(objectId, message);
  }
}
