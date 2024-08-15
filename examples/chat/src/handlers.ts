import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { addMessage, Chat } from "./objects/chat";

export const handleChatMessages = (chat: ChatI, e: any) => {
  if (e.detail.msg.topic === "topology::discovery") return;
  const input = uint8ArrayToString(e.detail.msg.data);
  const message = JSON.parse(input);
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
    addMessage(chat, args[0], args[1], args[2])
  } catch (e) {
    console.error(e);
  }
}
