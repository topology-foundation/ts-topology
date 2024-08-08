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
  SYNC
}

/* Utility function to execute object operations apart of calling the functions directly */
export async function executeObjectOperation(node: TopologyNode, operation: OPERATIONS, data: Uint8Array) {
  switch (operation) {
    case OPERATIONS.CREATE:
      // data = CRO
      createObject(node, data);
      break;
    case OPERATIONS.UPDATE:
      // data = [CRO_ID, OPERATION]
      updateObject(node, data)
      break;
    case OPERATIONS.SUBSCRIBE:
      // data = CRO_ID
      await subscribeObject(node, data)
      break;
    case OPERATIONS.UNSUBSCRIBE:
      // data = CRO_ID
      unsubscribeObject(node, data)
      break;
    case OPERATIONS.SYNC:
      // data = CRO
      // TODO: data = [CRO_ID, RIBLT]
      await syncObject(node, data)
      break;
    default:
      console.error("topology::node::executeObjectOperation", "Invalid operation");
      break;
  }
}

export function createObject(node: TopologyNode, data: Uint8Array) {
  const object = TopologyObject.decode(data)
  node.networkNode.subscribe(object.id);
  node.objectStore.put(object.id, object);
}

export function updateObject(node: TopologyNode, data: Uint8Array) {
  // TODO: should just send the object diff, not the full object
  // this is handler, we want the action of sending
  const object = TopologyObject.decode(data)
  node.objectStore.put(object.id, object);

  const message = Message.create({
    type: Message_MessageType.UPDATE,
    data: data
  });

  node.networkNode.broadcastMessage(
    object.id,
    message,
  );
}

export async function subscribeObject(node: TopologyNode, data: Uint8Array, fetch?: boolean, peerId?: string) {
  // process data as only the object id and not the full obj
  // need to create the obj anyway to sync empty obj
  const object = TopologyObject.decode(data)
  node.networkNode.subscribe(object.id);

  if (!fetch) return;
  const message = Message.create({
    sender: node.networkNode.peerId,
    type: Message_MessageType.SYNC,
    data
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

export function unsubscribeObject(node: TopologyNode, data: Uint8Array) {
  // process data as only the object id and not the full obj
  const object = TopologyObject.decode(data)
  node.networkNode.unsubscribe(object.id);
}

export async function syncObject(node: TopologyNode, data: Uint8Array, peerId?: string) {
  // Send sync request to a random peer
  const object = TopologyObject.decode(data)

  const message = Message.create({
    type: Message_MessageType.SYNC,
    data: data
  })

  // TODO: check how to do it better
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
