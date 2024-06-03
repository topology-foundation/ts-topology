import {
  TopologyNetworkNode,
  TopologyNetworkNodeConfig,
} from "@topologygg/network";

export interface TopologyNodeConfig {
  networkConfig: TopologyNetworkNodeConfig;
}

export class TopologyNode {
  private _config: TopologyNodeConfig;
  private _networkNode: TopologyNetworkNode;

  constructor(config: TopologyNodeConfig) {
    this._config = config;
    this._networkNode = new TopologyNetworkNode(config.networkConfig);
  }

  async start(): Promise<void> {
    await this._networkNode.start();
  }
}
