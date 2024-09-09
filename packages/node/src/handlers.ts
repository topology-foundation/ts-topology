import type { Stream } from "@libp2p/interface";
import { NetworkPb } from "@topology-foundation/network";
import { type TopologyObject, ObjectPb } from "@topology-foundation/object";
import * as lp from "it-length-prefixed";
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
		const buf = (await lp.decode(stream.source).return()).value;
		message = NetworkPb.Message.decode(
			new Uint8Array(buf ? buf.subarray() : []),
		);
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
			syncAcceptHandler(node, message.data);
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
	const object_operations = ObjectPb.TopologyObjectBase.decode(data);

	const object = node.objectStore.get(object_operations.id);
	if (!object) {
		console.error("topology::node::updateHandler", "Object not found");
		return false;
	}
	for (const v of object_operations.vertices) {
		const vertex = object.vertices.find((x) => x.hash === v.hash);
		if (!vertex) {
			object.vertices.push(v);
		}
	}
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

	// process, calculate diffs, and send back

	const message = NetworkPb.Message.create({
		sender: node.networkNode.peerId,
		type: NetworkPb.Message_MessageType.SYNC_ACCEPT,
		// add data here
		data: new Uint8Array(0),
	});

	node.networkNode.sendMessage(sender, [protocol], message);
}

/*
  data: { id: string, operations: {nonce: string, fn: string, args: string[] }[] }
  operations array contain the full remote operations array
*/
function syncAcceptHandler(node: TopologyNode, data: Uint8Array) {
	// don't blindly accept, validate the operations
	// might have have appeared in the meantime
	const object_operations = ObjectPb.TopologyObjectBase.decode(data);
	const object: TopologyObject | undefined = node.objectStore.get(
		object_operations.id,
	);
	if (!object) {
		console.error("topology::node::syncAcceptHandler", "Object not found");
		return false;
	}

	object_operations.vertices.filter((v1) => {
		if (object?.vertices.find((v2) => v1.hash === v2.hash)) {
			return false;
		}
		return true;
	});
	object.vertices.push(...object_operations.vertices);
	node.objectStore.put(object.id, object);

	return true;
	// TODO missing sending back the diff
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
	console.log("topology::node::objectChangesHandler", obj, originFn, vertices);
	switch (originFn) {
		case "merge":
			node.objectStore.put(obj.id, obj);
			break;
		case "callFn": {
			node.objectStore.put(obj.id, obj);
			// send vertices to the pubsub group
			const message = NetworkPb.Message.create({
				type: NetworkPb.Message_MessageType.UPDATE,
				data: ObjectPb.TopologyObjectBase.encode(obj).finish(),
			});
			node.networkNode.broadcastMessage(obj.id, message);
			break;
		}
		default:
			console.error("topology::node::createObject", "Invalid origin function");
	}
}
