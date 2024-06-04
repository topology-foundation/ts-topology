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
      const object = this._objectStore.get(message.detail.topic);

      // TODO: handle messages
      return;
    });
    */
  }

  createObject() {
    // TODO: generate from blueprint
    const croId = "";
    this._networkNode.subscribe(croId);
    // this._objectStore.put(croId, new TopologyObject());
  }

  getObject(croId: string): TopologyObject | undefined {
    return this._objectStore.get(croId);
  }
}
