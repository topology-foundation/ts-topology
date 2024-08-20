import { TopologyObject } from "@topology-foundation/object";
import { Message, Message_MessageType } from "@topology-foundation/network";
import { TopologyNode } from "./index.js";

/* Object operations */
export enum OPERATIONS {
  /* Create a new CRO */
  CREATE,
  /* Update operation on a CRO */
  UPDATE,

  /* Subscribe to a PubSub group (either CRO or custom) */
  SUBSCRIBE,
  /* Unsubscribe from a PubSub group */
  UNSUBSCRIBE,
  /* Actively send the CRO RIBLT to a random peer */
  SYNC,
}

/* Utility function to execute object operations apart of calling the functions directly */
export async function executeObjectOperation(
  node: TopologyNode,
  operation: OPERATIONS,
  data: Uint8Array,
  ...args: any[]
) {
  switch (operation) {
    case OPERATIONS.CREATE:
      createObject(node, data);
      break;
    case OPERATIONS.UPDATE:
      updateObject(node, data);
      break;
    case OPERATIONS.SUBSCRIBE:
      await subscribeObject(node, data, ...args);
      break;
    case OPERATIONS.UNSUBSCRIBE:
      unsubscribeObject(node, data, ...args);
      break;
    case OPERATIONS.SYNC:
      await syncObject(node, data, ...args);
      break;
    default:
      console.error(
        "topology::node::executeObjectOperation",
        "Invalid operation",
      );
      break;
  }
}

/* data: { id: string, abi: string, bytecode: Uint8Array } */
function createObject(node: TopologyNode, data: Uint8Array) {
  const object = TopologyObject.decode(data);
  node.networkNode.subscribe(object.id);
  node.objectStore.put(object.id, object);
}

/*
  data: { id: string, operations: {nonce: string, fn: string, args: string[] }[] }
  operations array doesn't contain the full remote operations array
*/
function updateObject(node: TopologyNode, data: Uint8Array) {
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

  const message = Message.create({
    type: Message_MessageType.UPDATE,
    data: data,
  });
  node.networkNode.broadcastMessage(object.id, message);
}

/* data: { id: string } */
async function subscribeObject(
  node: TopologyNode,
  data: Uint8Array,
  fetch?: boolean,
  peerId?: string,
) {
  const object = TopologyObject.decode(data);
  node.networkNode.subscribe(object.id);

  if (!fetch) return;
  // complies with format, since the operations array is empty
  const message = Message.create({
    sender: node.networkNode.peerId,
    type: Message_MessageType.SYNC,
    data,
  });

  if (!peerId) {
    await node.networkNode.sendGroupMessageRandomPeer(
      object.id,
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

/* data: { id: string } */
function unsubscribeObject(
  node: TopologyNode,
  data: Uint8Array,
  purge?: boolean,
) {
  const object = TopologyObject.decode(data);
  node.networkNode.unsubscribe(object.id);
  if (!purge) return;
  node.objectStore.remove(object.id);
}

/*
  data: { id: string, operations: {nonce: string, fn: string, args: string[] }[] }
  operations array contain the full remote operations array
*/
async function syncObject(
  node: TopologyNode,
  data: Uint8Array,
  peerId?: string,
) {
  const object = TopologyObject.decode(data);
  const message = Message.create({
    type: Message_MessageType.SYNC,
    data: data,
  });

  if (!peerId) {
    await node.networkNode.sendGroupMessageRandomPeer(
      object.id,
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
