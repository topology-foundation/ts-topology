import { TopologyObject } from "@topology-foundation/object";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { addMessage, Chat } from "./objects/chat";

export const handleChatMessages = (chat: Chat, e: any) => {
  console.log(e);
  // const input = TopologyObject.decode(e.detail.msg.data);

  console.log("Received message!: ", input);
  const message = {};
  console.log("Received message!: ", message);
  switch (message["type"]) {
    case "object_update": {
      const fn = uint8ArrayToString(new Uint8Array(message["data"]));
      handleObjectUpdate(chat, fn);
      break;
    }
    default: {
      break;
    }
  }
};

function handleObjectUpdate(chat: Chat, fn: string) {
  // In this case we only have addMessage
  // `addMessage(${timestamp}, ${message}, ${node.getPeerId()})`
  let args = fn.replace("addMessage(", "").replace(")", "").split(", ");
  console.log("Received message: ", args);
  try {
    addMessage(chat, args[0], args[1], args[2]);
  } catch (e) {
    console.error(e);
  }
}
