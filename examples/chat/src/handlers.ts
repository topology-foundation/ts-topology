import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { IChat } from "./objects/chat";

export const handleChatMessages = (chat: IChat, e: any) => {
    if (e.detail.msg.topic === "topology::discovery") return;
    const input = uint8ArrayToString(e.detail.msg.data);
    const message = JSON.parse(input);
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

function handleObjectUpdate(chat: IChat, fn: string) {
    // In this case we only have addMessage
    // `addMessage(${timestamp}, ${message}, ${node.getPeerId()})`
    let args = fn.replace("addMessage(", "").replace(")", "").split(", ");
    console.log("Received message: ", args);
    try {
        chat.addMessage(args[0], args[1], args[2]);
    } catch (e) {
        console.error(e);
    }
}