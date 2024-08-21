import { TopologyNode } from "@topology-foundation/node";
import * as topology from "@topology-foundation/node";
import { Chat, addMessage, getMessages } from "./objects/chat";
import { handleChatMessages } from "./handlers";
import { GSet } from "@topology-foundation/crdt";
import { newTopologyObject, TopologyObject } from "@topology-foundation/object";

const node = new TopologyNode();
// CRO = Conflict-free Replicated Object
let topologyObject: TopologyObject;
let chatCRO: Chat;
let peers: string[] = [];
let discoveryPeers: string[] = [];
let objectPeers: string[] = [];

const render = () => {
  const element_peerId = <HTMLDivElement>document.getElementById("peerId");
  element_peerId.innerHTML = node.networkNode.peerId;

  const element_peers = <HTMLDivElement>document.getElementById("peers");
  element_peers.innerHTML = "[" + peers.join(", ") + "]";

  const element_discoveryPeers = <HTMLDivElement>(
    document.getElementById("discoveryPeers")
  );
  element_discoveryPeers.innerHTML = "[" + discoveryPeers.join(", ") + "]";

  const element_objectPeers = <HTMLDivElement>(
    document.getElementById("objectPeers")
  );
  element_objectPeers.innerHTML = "[" + objectPeers.join(", ") + "]";

  if (!chatCRO) return;
  const chat = getMessages(chatCRO);
  const element_chat = <HTMLDivElement>document.getElementById("chat");
  element_chat.innerHTML = "";

  if (chat.set.size == 0) {
    const div = document.createElement("div");
    div.innerHTML = "No messages yet";
    div.style.padding = "10px";
    element_chat.appendChild(div);
    return;
  }
  Array.from(chat.set)
    .sort()
    .forEach((message: string) => {
      const div = document.createElement("div");
      div.innerHTML = message;
      div.style.padding = "10px";
      element_chat.appendChild(div);
    });
};

async function sendMessage(message: string) {
  let timestamp: string = Date.now().toString();
  if (!chatCRO) {
    console.error("Chat CRO not initialized");
    alert("Please create or join a chat room first");
    return;
  }
  console.log(
    "Sending message: ",
    `(${timestamp}, ${message}, ${node.networkNode.peerId})`,
  );

  // call the fn on the chat.ts object and the topologyObject
  addMessage(chatCRO, timestamp, message, node.networkNode.peerId);
  node.updateObject(topologyObject.id, [
    {
      fn: "addMessage",
      args: [timestamp, message, node.networkNode.peerId],
    },
  ]);

  render();
}

async function main() {
  await node.start();
  render();

  // generic message handler
  node.addCustomGroupMessageHandler("", (e) => {
    peers = node.networkNode.getAllPeers();
    discoveryPeers = node.networkNode.getGroupPeers("topology::discovery");

    // on create/connect
    if (chatCRO)
      objectPeers = node.networkNode.getGroupPeers(topologyObject.id);
    handleChatMessages(chatCRO, e);
    render();
  });

  let button_create = <HTMLButtonElement>document.getElementById("createRoom");
  button_create.addEventListener("click", async () => {
    chatCRO = new Chat();
    // TODO: path not used
    topologyObject = await newTopologyObject(
      node.networkNode.peerId,
      "/tmp/chat.ts",
    );

    (<HTMLButtonElement>document.getElementById("chatId")).innerHTML =
      topologyObject.id;
    render();
  });

  let button_connect = <HTMLButtonElement>document.getElementById("joinRoom");
  button_connect.addEventListener("click", async () => {
    let input: HTMLInputElement = <HTMLInputElement>(
      document.getElementById("roomInput")
    );
    let objectId = input.value;
    if (!objectId) {
      alert("Please enter a room id");
      return;
    }

    chatCRO = new Chat();
    //objectId
    await node.subscribeObject(objectId, true);
  });

  let button_fetch = <HTMLButtonElement>(
    document.getElementById("fetchMessages")
  );
  button_fetch.addEventListener("click", async () => {
    let input: HTMLInputElement = <HTMLInputElement>(
      document.getElementById("roomInput")
    );
    let objectId = input.value;
    try {
      let object: any = node.objectStore.get(objectId);
      console.log("Object received: ", object);

      let arr: string[] = Array.from(object["chat"]["_set"]);
      object["chat"]["_set"] = new Set<string>(arr);
      object["chat"] = Object.assign(
        new GSet<string>(new Set<string>()),
        object["chat"],
      );
      chatCRO = Object.assign(new Chat(), object);

      (<HTMLButtonElement>document.getElementById("chatId")).innerHTML =
        topologyObject.id;
      render();
    } catch (e) {
      console.error("Error while connecting to the CRO ", objectId, e);
    }
  });

  let button_send = <HTMLButtonElement>document.getElementById("sendMessage");
  button_send.addEventListener("click", async () => {
    let input: HTMLInputElement = <HTMLInputElement>(
      document.getElementById("messageInput")
    );
    let message: string = input.value;
    input.value = "";
    if (!message) {
      console.error("Tried sending an empty message");
      alert("Please enter a message");
      return;
    }
    await sendMessage(message);
    const element_chat = <HTMLDivElement>document.getElementById("chat");
    element_chat.scrollTop = element_chat.scrollHeight;
  });
}

main();
