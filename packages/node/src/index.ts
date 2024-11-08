import type { GossipsubMessage } from "@chainsafe/libp2p-gossipsub";
import type { EventCallback, StreamHandler } from "@libp2p/interface";
import {
	NetworkPb,
	TopologyNetworkNode,
	type TopologyNetworkNodeConfig,
} from "@topology-foundation/network";
import { type CRO, TopologyObject } from "@topology-foundation/object";
import { topologyMessagesHandler } from "./handlers.js";
import * as operations from "./operations.js";
import { TopologyObjectStore } from "./store/index.js";

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
		handler: EventCallback<CustomEvent<GossipsubMessage>>,
	) {
		this.networkNode.addGroupMessageHandler(group, handler);
	}

	sendGroupMessage(group: string, data: Uint8Array) {
		const message = NetworkPb.Message.create({
			sender: this.networkNode.peerId,
			type: NetworkPb.Message_MessageType.CUSTOM,
			data,
		});
		this.networkNode.broadcastMessage(group, message);
	}

	addCustomMessageHandler(protocol: string | string[], handler: StreamHandler) {
		this.networkNode.addMessageHandler(protocol, handler);
	}

	sendCustomMessage(peerId: string, protocol: string, data: Uint8Array) {
		const message = NetworkPb.Message.create({
			sender: this.networkNode.peerId,
			type: NetworkPb.Message_MessageType.CUSTOM,
			data,
		});
		this.networkNode.sendMessage(peerId, [protocol], message);
	}

	async createObject(
		cro: CRO,
		id?: string,
		abi?: string,
		sync?: boolean,
		peerId?: string,
	) {
		const object = new TopologyObject(this.networkNode.peerId, cro, id, abi);
		operations.createObject(this, object);
		operations.subscribeObject(this, object.id);
		if (sync) {
			console.log("SYNC OBJECT WHEN STARTING");
			operations.syncObject(this, object.id, peerId);
		}
		return object;
	}

	async subscribeObject(id: string) {
		return operations.subscribeObject(this, id);
	}

	unsubscribeObject(id: string, purge?: boolean) {
		operations.unsubscribeObject(this, id, purge);
	}

	async syncObject(id: string, peerId?: string) {
		operations.syncObject(this, id, peerId);
	}
}
