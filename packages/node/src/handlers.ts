import type { Stream } from "@libp2p/interface";
import { NetworkPb, streamToUint8Array } from "@topology-foundation/network";
import type {
	TopologyObject,
	ObjectPb,
	Vertex,
} from "@topology-foundation/object";
import type { TopologyNode } from "./index.js";

/*
  Handler for all CRO messages, including pubsub messages and direct messages
  You need to setup stream xor data, not both
*/
export async function topologyMessagesHandler(
	node: TopologyNode,
	stream?: Stream,
	data?: Uint8Array,
) {
	let message: NetworkPb.Message;
	if (stream) {
		const byteArray = await streamToUint8Array(stream);
		message = NetworkPb.Message.decode(byteArray);
	} else if (data) {
		message = NetworkPb.Message.decode(data);
	} else {
		console.error(
			"topology::node::messageHandler",
			"Stream and data are undefined",
		);
		return;
	}

	switch (message.type) {
		case NetworkPb.Message_MessageType.UPDATE:
			updateHandler(node, message.data);
			break;
		case NetworkPb.Message_MessageType.SYNC:
			if (!stream) {
				console.error("topology::node::messageHandler", "Stream is undefined");
				return;
			}
			syncHandler(
				node,
				stream.protocol ?? "/topology/message/0.0.1",
				message.sender,
				message.data,
			);
			break;
		case NetworkPb.Message_MessageType.SYNC_ACCEPT:
			if (!stream) {
				console.error("topology::node::messageHandler", "Stream is undefined");
				return;
			}
			syncAcceptHandler(
				node,
				stream.protocol ?? "/topology/message/0.0.1",
				message.sender,
				message.data,
			);
			break;
		case NetworkPb.Message_MessageType.SYNC_REJECT:
			syncRejectHandler(node, message.data);
			break;
		default:
			console.error("topology::node::messageHandler", "Invalid operation");
			break;
	}
}

/*
  data: { id: string, operations: {nonce: string, fn: string, args: string[] }[] }
  operations array doesn't contain the full remote operations array
*/
function updateHandler(node: TopologyNode, data: Uint8Array) {
	const updateMessage = NetworkPb.Update.decode(data);
	const object = node.objectStore.get(updateMessage.objectId);
	if (!object) {
		console.error("topology::node::updateHandler", "Object not found");
		return false;
	}

	object.merge(
		updateMessage.vertices.map((v) => {
			return {
				hash: v.hash,
				nodeId: v.nodeId,
				operation: {
					type: v.operation?.type ?? "",
					value: v.operation?.value,
				},
				dependencies: v.dependencies,
			};
		}),
	);
	node.objectStore.put(object.id, object);

	return true;
}

/*
  data: { id: string, operations: {nonce: string, fn: string, args: string[] }[] }
  operations array contain the full remote operations array
*/
function syncHandler(
	node: TopologyNode,
	protocol: string,
	sender: string,
	data: Uint8Array,
) {
	// (might send reject) <- TODO: when should we reject?
	const syncMessage = NetworkPb.Sync.decode(data);
	const object = node.objectStore.get(syncMessage.objectId);
	if (!object) {
		console.error("topology::node::syncHandler", "Object not found");
		return;
	}

	const diff: Set<NetworkPb.Vertex> = new Set(object.vertices);
	const missing: string[] = [];
	for (const h of syncMessage.vertexHashes) {
		const vertex = object.vertices.find((v) => v.hash === h);
		if (vertex) {
			diff.delete(vertex);
		} else {
			missing.push(h);
		}
	}

	if (diff.size === 0 && missing.length === 0) return;

	const message = NetworkPb.Message.create({
		sender: node.networkNode.peerId,
		type: NetworkPb.Message_MessageType.SYNC_ACCEPT,
		// add data here
		data: NetworkPb.SyncAccept.encode(
			NetworkPb.SyncAccept.create({
				objectId: object.id,
				diff: [...diff],
				missing,
			}),
		).finish(),
	});
	node.networkNode.sendMessage(sender, [protocol], message);
}

/*
  data: { id: string, operations: {nonce: string, fn: string, args: string[] }[] }
  operations array contain the full remote operations array
*/
function syncAcceptHandler(
	node: TopologyNode,
	protocol: string,
	sender: string,
	data: Uint8Array,
) {
	const syncAcceptMessage = NetworkPb.SyncAccept.decode(data);
	const object = node.objectStore.get(syncAcceptMessage.objectId);
	if (!object) {
		console.error("topology::node::syncAcceptHandler", "Object not found");
		return;
	}

	const vertices: Vertex[] = syncAcceptMessage.diff.map((v) => {
		return {
			hash: v.hash,
			nodeId: v.nodeId,
			operation: {
				type: v.operation?.type ?? "",
				value: v.operation?.value,
			},
			dependencies: v.dependencies,
		};
	});

	if (vertices.length !== 0) {
		object.merge(vertices);
		node.objectStore.put(object.id, object);
	}

	// send missing vertices
	const diff: NetworkPb.Vertex[] = [];
	for (const h of syncAcceptMessage.missing) {
		const vertex = object.vertices.find((v) => v.hash === h);
		if (vertex) {
			diff.push(vertex);
		}
	}

	if (diff.length === 0) return;

	const message = NetworkPb.Message.create({
		sender: node.networkNode.peerId,
		type: NetworkPb.Message_MessageType.SYNC_ACCEPT,
		data: NetworkPb.SyncAccept.encode(
			NetworkPb.SyncAccept.create({
				objectId: object.id,
				diff,
				missing: [],
			}),
		).finish(),
	});
	node.networkNode.sendMessage(sender, [protocol], message);
}

/* data: { id: string } */
function syncRejectHandler(node: TopologyNode, data: Uint8Array) {
	// TODO: handle reject. Possible actions:
	// - Retry sync
	// - Ask sync from another peer
	// - Do nothing
}

export function topologyObjectChangesHandler(
	node: TopologyNode,
	obj: TopologyObject,
	originFn: string,
	vertices: ObjectPb.Vertex[],
) {
	switch (originFn) {
		case "merge":
			node.objectStore.put(obj.id, obj);
			break;
		case "callFn": {
			node.objectStore.put(obj.id, obj);
			// send vertices to the pubsub group
			const message = NetworkPb.Message.create({
				sender: node.networkNode.peerId,
				type: NetworkPb.Message_MessageType.UPDATE,
				data: NetworkPb.Update.encode(
					NetworkPb.Update.create({
						objectId: obj.id,
						vertices: vertices,
					}),
				).finish(),
			});
			node.networkNode.broadcastMessage(obj.id, message);
			break;
		}
		default:
			console.error("topology::node::createObject", "Invalid origin function");
	}
}
