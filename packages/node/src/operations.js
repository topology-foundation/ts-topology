import { NetworkPb } from "@topology-foundation/network";
import { topologyMessagesHandler, topologyObjectChangesHandler, } from "./handlers.js";
/* Object operations */
var OPERATIONS;
(function (OPERATIONS) {
    /* Create a new CRO */
    OPERATIONS[OPERATIONS["CREATE"] = 0] = "CREATE";
    /* Update operation on a CRO */
    OPERATIONS[OPERATIONS["UPDATE"] = 1] = "UPDATE";
    /* Subscribe to a PubSub group (either CRO or custom) */
    OPERATIONS[OPERATIONS["SUBSCRIBE"] = 2] = "SUBSCRIBE";
    /* Unsubscribe from a PubSub group */
    OPERATIONS[OPERATIONS["UNSUBSCRIBE"] = 3] = "UNSUBSCRIBE";
    /* Actively send the CRO RIBLT to a random peer */
    OPERATIONS[OPERATIONS["SYNC"] = 4] = "SYNC";
})(OPERATIONS || (OPERATIONS = {}));
export function createObject(node, object) {
    node.objectStore.put(object.id, object);
    object.subscribe((obj, originFn, vertices) => topologyObjectChangesHandler(node, obj, originFn, vertices));
}
/* data: { id: string } */
export async function subscribeObject(node, objectId) {
    node.networkNode.subscribe(objectId);
    node.networkNode.addGroupMessageHandler(objectId, async (e) => topologyMessagesHandler(node, undefined, e.detail.msg.data));
}
export function unsubscribeObject(node, objectId, purge) {
    node.networkNode.unsubscribe(objectId);
    if (purge)
        node.objectStore.remove(objectId);
}
/*
  data: { vertex_hashes: string[] }
*/
export async function syncObject(node, objectId, peerId) {
    const object = node.objectStore.get(objectId);
    if (!object) {
        console.error("topology::node::syncObject", "Object not found");
        return;
    }
    const data = NetworkPb.Sync.create({
        objectId,
        vertexHashes: object.vertices.map((v) => v.hash),
    });
    const message = NetworkPb.Message.create({
        sender: node.networkNode.peerId,
        type: NetworkPb.Message_MessageType.SYNC,
        data: NetworkPb.Sync.encode(data).finish(),
    });
    if (!peerId) {
        await node.networkNode.sendGroupMessageRandomPeer(objectId, ["/topology/message/0.0.1"], message);
    }
    else {
        await node.networkNode.sendMessage(peerId, ["/topology/message/0.0.1"], message);
    }
}
