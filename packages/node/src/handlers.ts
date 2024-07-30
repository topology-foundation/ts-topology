import { Stream } from "@libp2p/interface";
import * as lp from "it-length-prefixed";
import {
  Message,
  Message_MessageType,
} from "@topology-foundation/network";
import { TopologyNode } from ".";

export async function topologyMessageHandler(node: TopologyNode, stream: Stream) {
  const buf = (await lp.decode(stream.source).return()).value;
  const message = Message.decode(new Uint8Array(buf ? buf.subarray() : []))

  switch (message.type) {
    case Message_MessageType.UPDATE:
      updateHandler(node, message.data);
      break;
    case Message_MessageType.SYNC:
      syncHandler(node, stream.protocol ?? "", message.sender, message.data);
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

function updateHandler(node: TopologyNode, data: Uint8Array) {
  //
}

function syncHandler(node: TopologyNode, protocol: string, sender: string, data: Uint8Array) {
  // Receive RBILT & send back
  // (might send reject) <- TODO: when should we reject?
  const message = Message.create({
    sender: node.networkNode.peerId,
    type: Message_MessageType.SYNC_ACCEPT,
    // add data here
    data: new Uint8Array(0),
  });

  node.networkNode.sendMessage(sender, [protocol], message);
}

function syncAcceptHandler(node: TopologyNode, data: Uint8Array) {
  // Process RBILT
}

function syncRejectHandler(node: TopologyNode, data: Uint8Array) {
  // Ask sync from another peer
}
