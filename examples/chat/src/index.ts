import { TopologyNode } from "@topology-foundation/node";
import { Chat, IChat } from "./objects/chat";
import { handleChatMessages } from "./handlers";

const node = new TopologyNode();
// CRO = Conflict-free Replicated Object
let chatCRO: IChat;
let peers: string[] = [];
let discoveryPeers: string[] = [];
let objectPeers: string[] = [];

const render = () => {
    const element_peerId = <HTMLDivElement>document.getElementById("peerId");
    element_peerId.innerHTML = node.networkNode.peerId;

    const element_peers = <HTMLDivElement>document.getElementById("peers");
    element_peers.innerHTML = "[" + peers.join(", ") + "]";

    const element_discoveryPeers = <HTMLDivElement>document.getElementById("discoveryPeers");
    element_discoveryPeers.innerHTML = "[" + discoveryPeers.join(", ") + "]";

    const element_objectPeers = <HTMLDivElement>document.getElementById("objectPeers");
    element_objectPeers.innerHTML = "[" + objectPeers.join(", ") + "]";

    if(!chatCRO) return;
    const chat = chatCRO.getMessages();
    const element_chat = <HTMLDivElement>document.getElementById("chat");
    element_chat.innerHTML = "";

    if(chat.set().size == 0){
        const div = document.createElement("div");
        div.innerHTML = "No messages yet";
        div.style.padding = "10px";
        element_chat.appendChild(div);
        return;
    }
    Array.from(chat.set()).sort().forEach((message: string) => {
        const div = document.createElement("div");
        div.innerHTML = message;
        div.style.padding = "10px";
        element_chat.appendChild(div);
    });

}

async function sendMessage(message: string) {
    let timestamp: string = Date.now().toString();
    if(!chatCRO) {
        console.error("Chat CRO not initialized");
        alert("Please create or join a chat room first");
        return;
    }
    console.log("Sending message: ", `(${timestamp}, ${message}, ${node.networkNode.peerId})`);
    chatCRO.addMessage(timestamp, message, node.networkNode.peerId);

    node.updateObject(chatCRO, `addMessage(${timestamp}, ${message}, ${node.networkNode.peerId})`);
    render();
}

async function main() {
    await node.start();
    render();

    node.addCustomGroupMessageHandler((e) => {
        handleChatMessages(chatCRO, e);
        peers = node.networkNode.getAllPeers();
        discoveryPeers = node.networkNode.getGroupPeers("topology::discovery");
        if(chatCRO) objectPeers = node.networkNode.getGroupPeers(chatCRO.getObjectId());
        render();
    });

    let button_create = <HTMLButtonElement>document.getElementById("createRoom");
    button_create.addEventListener("click", () => {
        chatCRO = new Chat(node.networkNode.peerId);
        node.createObject(chatCRO);
        (<HTMLButtonElement>document.getElementById("chatId")).innerHTML = chatCRO.getObjectId();
        render();
    });

    let button_connect = <HTMLButtonElement>document.getElementById("joinRoom");
    button_connect.addEventListener("click", async () => {
        let input: HTMLInputElement = <HTMLInputElement>document.getElementById("roomInput");
        let objectId = input.value;
        input.value = "";
        if(!objectId){
            alert("Please enter a room id");
            return;
        }
        try {
            await node.subscribeObject(objectId, true);

            let object: any = node.getObject(objectId);
            
            chatCRO = Object.assign(new Chat(node.networkNode.peerId), object);
            (<HTMLButtonElement>document.getElementById("chatId")).innerHTML = objectId;
            render();
        } catch (e) {
            console.error("Error while connecting to the CRO ", objectId, e);
        }
    });

    let button_send = <HTMLButtonElement>document.getElementById("sendMessage");
    button_send.addEventListener("click", async () => {
        let input: HTMLInputElement = <HTMLInputElement>document.getElementById("messageInput");
        let message: string = input.value;
        input.value = "";
        if(!message){
            console.error("Tried sending an empty message");
            alert("Please enter a message");
            return;
        }
        await sendMessage(message);
    });
}

main();