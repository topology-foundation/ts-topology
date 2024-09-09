import { NetworkPb } from "@topology-foundation/network";
import { type TopologyObject, ObjectPb } from "@topology-foundation/object";
import type { TopologyNode } from "./index.js";
import {
	topologyMessagesHandler,
	topologyObjectChangesHandler,
} from "./handlers.js";

/* Object operations */
export enum OPERATIONS {
	/* Create a new CRO */
	CREATE = 0,
	/* Update operation on a CRO */
	UPDATE = 1,

	/* Subscribe to a PubSub group (either CRO or custom) */
	SUBSCRIBE = 2,
	/* Unsubscribe from a PubSub group */
	UNSUBSCRIBE = 3,
	/* Actively send the CRO RIBLT to a random peer */
	SYNC = 4,
}

export function createObject(node: TopologyNode, object: TopologyObject) {
	node.objectStore.put(object.id, object);
	object.subscribe((obj, originFn, vertices) =>
		topologyObjectChangesHandler(node, obj, originFn, vertices),
	);
	node.networkNode.subscribe(object.id);
	node.networkNode.addGroupMessageHandler(object.id, async (e) =>
		topologyMessagesHandler(node, undefined, e.detail.msg.data),
	);
}

/*
  data: { id: string, operations: {nonce: string, fn: string, args: string[] }[] }
  operations array doesn't contain the full remote operations array
*/
export function updateObject(node: TopologyNode, data: Uint8Array) {
	const object_operations = ObjectPb.TopologyObjectBase.decode(data);
	let object: ObjectPb.TopologyObjectBase | undefined = node.objectStore.get(
		object_operations.id,
	);
	if (!object) {
		object = ObjectPb.TopologyObjectBase.create({
			id: object_operations.id,
		});
	}

	for (const v1 of object_operations.vertices) {
		if (object.vertices.some((v2) => v1.hash === v2.hash)) continue;
		object.vertices.push(v1);
	}
	node.objectStore.put(object.id, object);

	const message = NetworkPb.Message.create({
		type: NetworkPb.Message_MessageType.UPDATE,
		data: data,
	});
	node.networkNode.broadcastMessage(object.id, message);
}

/* data: { id: string } */
export async function subscribeObject(
	node: TopologyNode,
	objectId: string,
	sync?: boolean,
	peerId?: string,
) {
	node.networkNode.subscribe(objectId);

	if (!sync) return;
	// complies with format, since the operations array is empty
	const message = NetworkPb.Message.create({
		sender: node.networkNode.peerId,
		type: NetworkPb.Message_MessageType.SYNC,
		data: new Uint8Array(0),
	});

	if (!peerId) {
		await node.networkNode.sendGroupMessageRandomPeer(
			objectId,
			["/topology/message/0.0.1"],
			message,
		);
	} else {
		await node.networkNode.sendMessage(
			peerId,
			["/topology/message/0.0.1"],
			message,
		);
	}
}

export function unsubscribeObject(
	node: TopologyNode,
	objectId: string,
	purge?: boolean,
) {
	node.networkNode.unsubscribe(objectId);
	if (purge) node.objectStore.remove(objectId);
}

/*
  data: { id: string, vertices: Vertex[] }
  operations array contain the full remote operations array
*/
export async function syncObject(
	node: TopologyNode,
	objectId: string,
	data: Uint8Array,
	peerId?: string,
) {
	const message = NetworkPb.Message.create({
		type: NetworkPb.Message_MessageType.SYNC,
		data: data,
	});

	if (!peerId) {
		await node.networkNode.sendGroupMessageRandomPeer(
			objectId,
			["/topology/message/0.0.1"],
			message,
		);
	} else {
		await node.networkNode.sendMessage(
			peerId,
			["/topology/message/0.0.1"],
			message,
		);
	}
}
