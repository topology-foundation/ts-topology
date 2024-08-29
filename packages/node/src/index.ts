import type { GossipsubMessage } from "@chainsafe/libp2p-gossipsub";
import type { EventCallback, StreamHandler } from "@libp2p/interface";
import {
	Message,
	Message_MessageType,
	TopologyNetworkNode,
	type TopologyNetworkNodeConfig,
} from "@topology-foundation/network";
import {
	type CRO,
	TopologyObjectBase,
	newTopologyObject,
} from "@topology-foundation/object";
import { topologyMessagesHandler } from "./handlers.js";
import { OPERATIONS, executeObjectOperation } from "./operations.js";
import { TopologyObjectStore } from "./store/index.js";

import * as crypto from "node:crypto";
export * from "./operations.js";

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
		const message = Message.create({
			sender: this.networkNode.peerId,
			type: Message_MessageType.CUSTOM,
			data,
		});
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

	async createObject<T>(cro: CRO<T>, id?: string, path?: string, abi?: string) {
		const object = await newTopologyObject(
			this.networkNode.peerId,
			cro,
			path,
			id,
			abi,
		);
		executeObjectOperation(
			this,
			OPERATIONS.CREATE,
			TopologyObjectBase.encode(object).finish(),
		);
		this.networkNode.addGroupMessageHandler(object.id, async (e) =>
			topologyMessagesHandler(this, undefined, e.detail.msg.data),
		);
		return object;
	}

	updateObject(id: string, operations: { fn: string; args: string[] }[]) {
		// TODO: needs refactor for working with hash graph
		const object = TopologyObjectBase.create({
			id,
		});
		executeObjectOperation(
			this,
			OPERATIONS.UPDATE,
			TopologyObjectBase.encode(object).finish(),
		);
	}

	async subscribeObject(id: string, fetch?: boolean, peerId?: string) {
		const object = TopologyObjectBase.create({
			id,
		});
		executeObjectOperation(
			this,
			OPERATIONS.SUBSCRIBE,
			TopologyObjectBase.encode(object).finish(),
			fetch,
			peerId,
		);
		this.networkNode.addGroupMessageHandler(id, async (e) =>
			topologyMessagesHandler(this, undefined, e.detail.msg.data),
		);
		return object;
	}

	unsubscribeObject(id: string, purge?: boolean) {
		const object = TopologyObjectBase.create({
			id,
		});
		executeObjectOperation(
			this,
			OPERATIONS.UNSUBSCRIBE,
			TopologyObjectBase.encode(object).finish(),
			purge,
		);
	}

	async syncObject(
		id: string,
		operations: { nonce: string; fn: string; args: string[] }[],
		peerId?: string,
	) {
		const object = TopologyObjectBase.create({
			id,
		});
		executeObjectOperation(
			this,
			OPERATIONS.SYNC,
			TopologyObjectBase.encode(object).finish(),
			peerId,
		);
	}
}

function generateNonce(fn: string, args: string[]) {
	return crypto
		.createHash("sha256")
		.update(fn)
		.update(args.join(","))
		.update(Math.floor(Math.random() * Number.MAX_VALUE).toString())
		.digest("hex");
}
