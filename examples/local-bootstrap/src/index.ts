import {
	TopologyNode,
	type TopologyNodeConfig,
} from "@topology-foundation/node";
import type { TopologyObject } from "@topology-foundation/object";
import { Chat } from "./objects/chat";

const local_peer_id = "12D3KooWC6sm9iwmYbeQJCJipKTRghmABNz1wnpJANvSMabvecwJ";
const local_bootstrap_peer_ip = "127.0.0.1"; // This is the IP of the local bootstrap node, replace it with the IP of the local node

if (!local_peer_id) {
	console.error(
		"topology::network::start::bootstrap: Set local_peer_id in `/examples/localdev/src/index.ts` file with the peer id of the local bootstrap node",
	);
	process.exit(1);
}

let node: TopologyNode;

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

async function initTopologyNode() {
	if (node) {
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

		const button_connect = <HTMLButtonElement>(
			document.getElementById("joinRoom")
		);
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

		const button_send = <HTMLButtonElement>(
			document.getElementById("sendMessage")
		);
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
}

async function main() {
	const select_address_type = <HTMLSelectElement>(
		document.getElementById("bootstrap_node_host_address_type")
	);
	const address_type_label = <HTMLSpanElement>(
		document.getElementById("bootstrap_addr_type")
	);
	const bootstrap_node_addr = <HTMLInputElement>(
		document.getElementById("bootstrap_node_addr")
	);

	// Default to IP4
	select_address_type.value = "ip4";
	address_type_label.innerText = "IP address";

	select_address_type?.addEventListener("change", (e) => {
		const val = select_address_type.value;
		if (val === "ip4") {
			address_type_label.innerText = "IP address";
			bootstrap_node_addr.placeholder = "0.0.0.0";
			bootstrap_node_addr.value = "127.0.0.1";
		} else if (val === "dns4") {
			address_type_label.innerText = "DNS address";
			bootstrap_node_addr.placeholder = "example.com";
			bootstrap_node_addr.value = "";
		}
	});

	const connect_form = <HTMLFormElement>(
		document.getElementById("form_connect_to_bootstrap_node")
	);
	connect_form?.addEventListener("submit", async (e) => {
		e.preventDefault();
		const bootstrap_node_port: HTMLInputElement = <HTMLInputElement>(
			document.getElementById("bootstrap_node_port")
		);
		const bootstrap_node_peer_id: HTMLInputElement = <HTMLInputElement>(
			document.getElementById("bootstrap_node_peer_id")
		);

		if (
			!bootstrap_node_addr.value ||
			!bootstrap_node_port.value ||
			!bootstrap_node_peer_id.value
		) {
			alert("Please fill in all the fields");
			return;
		}

		const is_ws: HTMLInputElement = <HTMLInputElement>(
			document.getElementById("ws")
		);

		const ws_protocl = is_ws.checked ? "ws" : "wss";
		const field_set = <HTMLFieldSetElement>(
			document.getElementById("fieldset_connect_bootstrap_node")
		);
		try {
			node = new TopologyNode({
				network_config: {
					bootstrap_peers: [
						`/${select_address_type.value}/${bootstrap_node_addr.value}/tcp/${bootstrap_node_port.value}/${ws_protocl}/p2p/${bootstrap_node_peer_id.value}`,
					],
					bootstrap: false,
				},
			});

			await node.start();
			field_set.style.backgroundColor = "rgba(0, 255, 0, 0.2)";
			initTopologyNode();
			render();
		} catch (e) {
			field_set.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
			alert("Failed to connect to the bootstrap node");
			return;
		}
	});

	render();

	// generic message handler
}

main();
