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

    /*
    this._networkNode.pubSubEventListener()?.("message", (message) => {
      // const object = this._objectStore.get(message.detail.topic);
      console.log(message.detail);

      // TODO: handle messages
      return;
    });
    */
  }

  createObject(object: TopologyObject) {
    object.init();
    const objectId = object.getObjectId();
    this._networkNode.subscribe(objectId);
    this._objectStore.put(objectId, object);
  }

  getObject(objectId: string): TopologyObject | undefined {
    // TODO fetch it from the network
    this._networkNode.subscribe(objectId);

    const message = new TextEncoder().encode("quack");
    this._networkNode.sendMessage(objectId, message);

    return this._objectStore.get(objectId);
  }

  sendObjectUpdate(objectId: string) {
    const message = new TextEncoder().encode("quack");
    this._networkNode.sendMessage(objectId, message);
  }
}
