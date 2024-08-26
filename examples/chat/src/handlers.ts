import { TopologyObject_Operation } from "@topology-foundation/object";
import { addMessage, Chat } from "./objects/chat";

export function handleObjectOps(chat: Chat, ops: TopologyObject_Operation[]) {
  // In this case we only have addMessage
  // `addMessage(${timestamp}, ${message}, ${node.getPeerId()})`
  try {
    for (const op of ops) {
      addMessage(chat, op.args[0], op.args[1], op.args[2]);
    }
  } catch (e) {
    console.error(e);
  }
}
