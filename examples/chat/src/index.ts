import { TopologyNode, type TopologyNodeConfig } from "@topology-foundation/node";
import type { TopologyObject } from "@topology-foundation/object";
import { Chat } from "./objects/chat";

const node_config : TopologyNodeConfig = {
	network_config: {
		bootstrap_peers : [
			// "/ip4/127.0.0.1/tcp/50000/ws/p2p/12D3KooWC6sm9iwmYbeQJCJipKTRghmABNz1wnpJANvSMabvecwJ",
			"/dns4/relay.droak.sh/tcp/443/wss/p2p/Qma3GsJmB47xYuyahPZPSadh1avvxfyYQwk8R3UnFrQ6aP"

		],
		bootstrap : false,
		"addresses": ["/webrtc"],
	},
};

const node = new TopologyNode(node_config);
// CRO = Conflict-free Replicated Object
let topologyObject: TopologyObject;
let chatCRO: Chat;
let peers: string[] = [];
let discoveryPeers: string[] = [];
let objectPeers: string[] = [];

const render = () => {
	if (topologyObject)
		(<HTMLButtonElement>document.getElementById("chatId")).innerText =
			topologyObject.id;
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

async function sendMessage(message: string) {
	const timestamp: string = Date.now().toString();
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

	const button_create = <HTMLButtonElement>(
		document.getElementById("createRoom")
	);
	button_create.addEventListener("click", async () => {
		topologyObject = await node.createObject(new Chat());
		chatCRO = topologyObject.cro as Chat;
		createConnectHandlers();
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

		topologyObject = await node.createObject(
			new Chat(),
			objectId,
			undefined,
			true,
		);
		chatCRO = topologyObject.cro as Chat;
		createConnectHandlers();
		render();
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
