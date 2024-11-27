import { TopologyNode } from "@topology-foundation/node";
import type { TopologyObject } from "@topology-foundation/object";
import { Chat } from "./chat.js";
import { MockTopologyNetworkNode, MockNetwork } from "./network.js";

const globalNetwork = new MockNetwork();

const alice_node = new TopologyNode({
	network_config: {
		bootstrap_peers: [
			"/ip4/192.168.1.4/tcp/50000/ws/p2p/12D3KooWC6sm9iwmYbeQJCJipKTRghmABNz1wnpJANvSMabvecwJ",
		],
		private_key_seed: "alice",
		log_config: {
			level: "info",
		},
	},
}); // 12D3KooWLwDVjfrNtXG2h48kftoyXGMCyzhPWs8M3HVYkunarkvM
alice_node.networkNode = new MockTopologyNetworkNode(globalNetwork, "12D3KooWLwDVjfrNtXG2h48kftoyXGMCyzhPWs8M3HVYkunarkvM");

const bob_node = new TopologyNode({
	network_config: {
		bootstrap_peers: [
			"/ip4/192.168.1.4/tcp/50000/ws/p2p/12D3KooWC6sm9iwmYbeQJCJipKTRghmABNz1wnpJANvSMabvecwJ",
		],
		private_key_seed: "bob",
		log_config: {
			level: "info",
		},
	},
}); // 12D3KooWFxkyHM2edHpzuHqUB7Q5PgdxJApw6wzBzLkaoBWY7dL7
bob_node.networkNode = new MockTopologyNetworkNode(globalNetwork, "12D3KooWFxkyHM2edHpzuHqUB7Q5PgdxJApw6wzBzLkaoBWY7dL7");

let alice_object: TopologyObject;
let alice_cro: Chat;

let bob_object: TopologyObject;
let bob_cro: Chat;

function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function test(d: number) {
	await alice_node.start();
	await bob_node.start();

	const nlocal = d >> 1;
	const nremote = d >> 1;
	const ncommon = d;

	alice_object = await alice_node.createObject(new Chat());
	alice_cro = alice_object.cro as Chat;

	for (let i = 0; i < ncommon; i++) {
		const timestamp = Date.now().toString();
		alice_cro.addMessage(
			timestamp,
			`Hello Common ${i}`,
			alice_node.networkNode.peerId,
		);
	}

	bob_object = await bob_node.createObject(new Chat(), alice_object.id, undefined, true);
	bob_cro = bob_object.cro as Chat;

	// console.log(alice_cro.messages);
	// console.log(bob_cro.messages);

	await timeout(2000);

	// (bob_node.networkNode as MockTopologyNetworkNode).stop();

	for (let i = 0; i < nlocal; i++) {
		const timestamp = Date.now().toString();
		alice_cro.addMessage(
			timestamp,
			`Hello, Alice ${i}`,
			alice_node.networkNode.peerId,
		);
	}

	await timeout(1000);

	console.log(alice_cro.messages);
	console.log(bob_cro.messages);

	let first_time = true;

	// generic message handler
	bob_node.addCustomGroupMessageHandler("", async (e) => {
		const peers = bob_node.networkNode.getAllPeers();
		console.log(`peers: ${peers}`);
		console.log(`require: ${alice_node.networkNode.peerId}`);
		if (peers.includes(alice_node.networkNode.peerId) && first_time) {
			first_time = false;
		}
	});
}

test(10);
