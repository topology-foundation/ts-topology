"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("@topology-foundation/node");
const chat_1 = require("./objects/chat");
const node = new node_1.TopologyNode();
// CRO = Conflict-free Replicated Object
let topologyObject;
let chatCRO;
let peers = [];
let discoveryPeers = [];
let objectPeers = [];
const render = () => {
    if (topologyObject)
        document.getElementById("chatId").innerText =
            topologyObject.id;
    const element_peerId = document.getElementById("peerId");
    element_peerId.innerHTML = node.networkNode.peerId;
    const element_peers = document.getElementById("peers");
    element_peers.innerHTML = `[${peers.join(", ")}]`;
    const element_discoveryPeers = (document.getElementById("discoveryPeers"));
    element_discoveryPeers.innerHTML = `[${discoveryPeers.join(", ")}]`;
    const element_objectPeers = (document.getElementById("objectPeers"));
    element_objectPeers.innerHTML = `[${objectPeers.join(", ")}]`;
    if (!chatCRO)
        return;
    const chat = chatCRO.getMessages();
    const element_chat = document.getElementById("chat");
    element_chat.innerHTML = "";
    if (chat.size === 0) {
        const div = document.createElement("div");
        div.innerHTML = "No messages yet";
        div.style.padding = "10px";
        element_chat.appendChild(div);
        return;
    }
    for (const message of [...chat].sort()) {
        const div = document.createElement("div");
        div.innerHTML = message;
        div.style.padding = "10px";
        element_chat.appendChild(div);
    }
};
async function sendMessage(message) {
    const timestamp = Date.now().toString();
    if (!chatCRO) {
        console.error("Chat CRO not initialized");
        alert("Please create or join a chat room first");
        return;
    }
    chatCRO.addMessage(timestamp, message, node.networkNode.peerId);
    render();
}
async function createConnectHandlers() {
    node.addCustomGroupMessageHandler(topologyObject.id, (e) => {
        // on create/connect
        if (topologyObject)
            objectPeers = node.networkNode.getGroupPeers(topologyObject.id);
        render();
    });
    node.objectStore.subscribe(topologyObject.id, (_, _obj) => {
        render();
    });
}
async function main() {
    await node.start();
    render();
    // generic message handler
    node.addCustomGroupMessageHandler("", (e) => {
        peers = node.networkNode.getAllPeers();
        discoveryPeers = node.networkNode.getGroupPeers("topology::discovery");
        render();
    });
    const button_create = (document.getElementById("createRoom"));
    button_create.addEventListener("click", async () => {
        topologyObject = await node.createObject(new chat_1.Chat());
        chatCRO = topologyObject.cro;
        createConnectHandlers();
        render();
    });
    const button_connect = document.getElementById("joinRoom");
    button_connect.addEventListener("click", async () => {
        const input = (document.getElementById("roomInput"));
        const objectId = input.value;
        if (!objectId) {
            alert("Please enter a room id");
            return;
        }
        topologyObject = await node.createObject(new chat_1.Chat(), objectId, undefined, true);
        chatCRO = topologyObject.cro;
        createConnectHandlers();
        render();
    });
    const button_send = document.getElementById("sendMessage");
    button_send.addEventListener("click", async () => {
        const input = (document.getElementById("messageInput"));
        const message = input.value;
        input.value = "";
        if (!message) {
            console.error("Tried sending an empty message");
            alert("Please enter a message");
            return;
        }
        await sendMessage(message);
        const element_chat = document.getElementById("chat");
        element_chat.scrollTop = element_chat.scrollHeight;
    });
}
main();
