import { Stream } from "@libp2p/interface";
import * as lp from "it-length-prefixed";
import { Message, Message_MessageType } from "@topology-foundation/network";
import { TopologyNode } from "./index.js";
import { TopologyObject } from "@topology-foundation/object";

export async function topologyMessagesHandler(
  node: TopologyNode,
  stream: Stream,
) {
  const buf = (await lp.decode(stream.source).return()).value;
  const message = Message.decode(new Uint8Array(buf ? buf.subarray() : []));

  switch (message.type) {
    case Message_MessageType.UPDATE:
      updateHandler(node, message.data);
      break;
    case Message_MessageType.SYNC:
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
  const object_operations = TopologyObject.decode(data);
  let object = node.objectStore.get(object_operations.id);
  if (!object) {
    object = TopologyObject.create({
      id: object_operations.id,
      operations: [],
    });
  }
  object.operations.push(...object_operations.operations);
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
  let object_operations = TopologyObject.decode(data);
  let object = node.objectStore.get(object_operations.id);
  if (!object) {
    object = TopologyObject.create({
      id: object_operations.id,
      operations: [],
    });
  }

  object_operations.operations.filter((op) => {
    if (object?.operations.find((op2) => op.nonce === op2.nonce)) {
      return false;
    }
    return true;
  });
  object.operations.push(...object_operations.operations);
  node.objectStore.put(object.id, object);
}

/* data: { id: string } */
function syncRejectHandler(node: TopologyNode, data: Uint8Array) {
  // TODO: handle reject. Possible actions:
  // - Retry sync
  // - Ask sync from another peer
  // - Do nothing
}
