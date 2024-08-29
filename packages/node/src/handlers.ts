import type { Stream } from "@libp2p/interface";
import { Message, Message_MessageType } from "@topology-foundation/network";
import { TopologyObjectBase } from "@topology-foundation/object";
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
	let message: Message;
	if (stream) {
		const buf = (await lp.decode(stream.source).return()).value;
		message = Message.decode(new Uint8Array(buf ? buf.subarray() : []));
	} else if (data) {
		message = Message.decode(data);
	} else {
		console.error(
			"topology::node::messageHandler",
			"Stream and data are undefined",
		);
		return;
	}

	switch (message.type) {
		case Message_MessageType.UPDATE:
			updateHandler(node, message.data);
			break;
		case Message_MessageType.SYNC:
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
		case Message_MessageType.SYNC_ACCEPT:
			syncAcceptHandler(node, message.data);
			break;
		case Message_MessageType.SYNC_REJECT:
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
	const object_operations = TopologyObjectBase.decode(data);
	let object = node.objectStore.get(object_operations.id);
	if (!object) {
		object = TopologyObjectBase.create({
			id: object_operations.id,
		});
	}
	object.vertices.push(...object_operations.vertices);
	node.objectStore.put(object.id, object);
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

	const message = Message.create({
		sender: node.networkNode.peerId,
		type: Message_MessageType.SYNC_ACCEPT,
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
	const object_operations = TopologyObjectBase.decode(data);
	let object: TopologyObjectBase | undefined = node.objectStore.get(
		object_operations.id,
	);
	if (!object) {
		object = TopologyObjectBase.create({
			id: object_operations.id,
		});
	}

	object_operations.vertices.filter((v1) => {
		if (object?.vertices.find((v2) => v1.hash === v2.hash)) {
			return false;
		}
		return true;
	});
	object.vertices.push(...object_operations.vertices);
	node.objectStore.put(object.id, object);

	// TODO missing sending back the diff
}

/* data: { id: string } */
function syncRejectHandler(node: TopologyNode, data: Uint8Array) {
	// TODO: handle reject. Possible actions:
	// - Retry sync
	// - Ask sync from another peer
	// - Do nothing
}
