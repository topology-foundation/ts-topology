import { GSet } from "@topology-foundation/crdt";
import { TopologyNode } from "@topology-foundation/node";
import { TopologyObject } from "@topology-foundation/object";
import { handleChatMessages } from "./handlers";
import { Chat, type IChat } from "./objects/chat";

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
	element_peers.innerHTML = `[${peers.join(", ")}]`;

	const element_discoveryPeers = <HTMLDivElement>(
		document.getElementById("discoveryPeers")
	);
	element_discoveryPeers.innerHTML = `[${discoveryPeers.join(", ")}]`;

	const element_objectPeers = <HTMLDivElement>(
		document.getElementById("objectPeers")
	);
	element_objectPeers.innerHTML = `[${objectPeers.join(", ")}]`;

	if (!chatCRO) return;
	const chat = chatCRO.getMessages();
	const element_chat = <HTMLDivElement>document.getElementById("chat");
	element_chat.innerHTML = "";

	if (chat.set().size === 0) {
		const div = document.createElement("div");
		div.innerHTML = "No messages yet";
		div.style.padding = "10px";
		element_chat.appendChild(div);
		return;
	}

	for (const message of [...chat.set()].sort()) {
		const div = document.createElement("div");
		div.innerHTML = message;
		div.style.padding = "10px";
		element_chat.appendChild(div);
	}
};

async function sendMessage(message: string) {
	const timestamp: string = Date.now().toString();
	if (!chatCRO) {
		console.error("Chat CRO not initialized");
		alert("Please create or join a chat room first");
		return;
	}
	console.log(
		"Sending message: ",
		`(${timestamp}, ${message}, ${node.networkNode.peerId})`,
	);
	chatCRO.addMessage(timestamp, message, node.networkNode.peerId);

	node.updateObject(
		chatCRO,
		`addMessage(${timestamp}, ${message}, ${node.networkNode.peerId})`,
	);
	render();
}

async function main() {
	await node.start();
	render();

	node.addCustomGroupMessageHandler((e) => {
		handleChatMessages(chatCRO, e);
		peers = node.networkNode.getAllPeers();
		discoveryPeers = node.networkNode.getGroupPeers("topology::discovery");
		if (chatCRO)
			objectPeers = node.networkNode.getGroupPeers(chatCRO.getObjectId());
		render();
	});

	const button_create = <HTMLButtonElement>(
		document.getElementById("createRoom")
	);
	button_create.addEventListener("click", () => {
		chatCRO = new Chat(node.networkNode.peerId);
		node.createObject(chatCRO);
		(<HTMLButtonElement>document.getElementById("chatId")).innerHTML =
			chatCRO.getObjectId();
		render();
	});

	const button_connect = <HTMLButtonElement>document.getElementById("joinRoom");
	button_connect.addEventListener("click", async () => {
		const input: HTMLInputElement = <HTMLInputElement>(
			document.getElementById("roomInput")
		);
		const objectId = input.value;
		if (!objectId) {
			alert("Please enter a room id");
			return;
		}
		await node.subscribeObject(objectId, true);
	});

	const button_fetch = <HTMLButtonElement>(
		document.getElementById("fetchMessages")
	);
	button_fetch.addEventListener("click", async () => {
		const input: HTMLInputElement = <HTMLInputElement>(
			document.getElementById("roomInput")
		);
		const objectId = input.value;
		try {
			const object: Chat = node.getObject(objectId) as Chat;
			console.log("Object received: ", object);

			const arr: string[] = Array.from(object.chat.set);
			object.chat.set = new Set<string>(arr);
			object.chat = Object.assign(
				new GSet<string>(new Set<string>()),
				object.chat,
			);
			chatCRO = Object.assign(new Chat(node.networkNode.peerId), object);

			(<HTMLButtonElement>document.getElementById("chatId")).innerHTML =
				chatCRO.getObjectId();
			render();
		} catch (e) {
			console.error("Error while connecting to the CRO ", objectId, e);
		}
	});

	const button_send = <HTMLButtonElement>document.getElementById("sendMessage");
	button_send.addEventListener("click", async () => {
		const input: HTMLInputElement = <HTMLInputElement>(
			document.getElementById("messageInput")
		);
		const message: string = input.value;
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
