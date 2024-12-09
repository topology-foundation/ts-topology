import { TopologyNode } from "@topology-foundation/node";
import Benchmark from "benchmark";
import { TopologyObject } from "@topology-foundation/object";
import { SetOfIntegers } from "./integers.js";
import {
	MockTopologyNetworkNode,
	MockNetwork,
	globalNetworkStats,
} from "./network.js";
import { TopologyObjectStore } from "@topology-foundation/node/dist/src/store/index.js";

// const alice_node = new TopologyNode({
// 	network_config: {
// 		bootstrap_peers: [
// 			"/ip4/192.168.1.4/tcp/50000/ws/p2p/12D3KooWC6sm9iwmYbeQJCJipKTRghmABNz1wnpJANvSMabvecwJ",
// 		],
// 		private_key_seed: "alice",
// 		log_config: {
// 			level: "info",
// 		},
// 	},
// }); // 12D3KooWLwDVjfrNtXG2h48kftoyXGMCyzhPWs8M3HVYkunarkvM
// alice_node.networkNode = new MockTopologyNetworkNode(
// 	globalNetwork,
// 	"12D3KooWLwDVjfrNtXG2h48kftoyXGMCyzhPWs8M3HVYkunarkvM",
// );

// const bob_node = new TopologyNode({
// 	network_config: {
// 		bootstrap_peers: [
// 			"/ip4/192.168.1.4/tcp/50000/ws/p2p/12D3KooWC6sm9iwmYbeQJCJipKTRghmABNz1wnpJANvSMabvecwJ",
// 		],
// 		private_key_seed: "bob",
// 		log_config: {
// 			level: "info",
// 		},
// 	},
// }); // 12D3KooWFxkyHM2edHpzuHqUB7Q5PgdxJApw6wzBzLkaoBWY7dL7
// bob_node.networkNode = new MockTopologyNetworkNode(
// 	globalNetwork,
// 	"12D3KooWFxkyHM2edHpzuHqUB7Q5PgdxJApw6wzBzLkaoBWY7dL7",
// );

let alice_node = new TopologyNode();
let bob_node = new TopologyNode();
let globalNetwork = new MockNetwork();

function timeout(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function test(ncommon: number, d: number) {
	globalNetwork = new MockNetwork();

	alice_node = new TopologyNode();
	alice_node.networkNode = new MockTopologyNetworkNode(
		globalNetwork,
		"12D3KooWLwDVjfrNtXG2h48kftoyXGMCyzhPWs8M3HVYkunarkvM",
	);
	bob_node = new TopologyNode();
	bob_node.networkNode = new MockTopologyNetworkNode(
		globalNetwork,
		"12D3KooWFxkyHM2edHpzuHqUB7Q5PgdxJApw6wzBzLkaoBWY7dL7",
	);

	await alice_node.start();
	await bob_node.start();

	const nlocal = d >> 1;
	const nremote = d >> 1;

	const alice_object = await alice_node.createObject(new SetOfIntegers());
	const alice_cro = alice_object.cro as SetOfIntegers;

	let valueIndex = 0;

	for (let i = 0; i < ncommon; i++) {
		alice_cro.add(valueIndex++);
	}
	await timeout(500);

	const bob_object = await bob_node.createObject(
		new SetOfIntegers(),
		alice_object.id,
		undefined,
		true,
	);
	const bob_cro = bob_object.cro as SetOfIntegers;
	await timeout(500);

	if (
		alice_cro.getValues().size !== ncommon ||
		bob_cro.getValues().size !== ncommon
	) {
		throw Error("Failed to sync values");
	}

	(alice_node.networkNode as MockTopologyNetworkNode).stop();
	(bob_node.networkNode as MockTopologyNetworkNode).stop();

	for (let i = 0; i < nlocal; i++) {
		alice_cro.add(valueIndex++);
	}

	for (let i = 0; i < nremote; i++) {
		bob_cro.add(valueIndex++);
	}
	await timeout(500);

	(alice_node.networkNode as MockTopologyNetworkNode).start();
	(bob_node.networkNode as MockTopologyNetworkNode).start();

	// reset stats
	globalNetworkStats.bytesTransmitted = 0;
	globalNetworkStats.roundTrips = 0;

	alice_node.syncObject(alice_object.id, bob_node.networkNode.peerId);
	await timeout(5000);

	return globalNetworkStats;
}

console.log("(10000, 1)");
console.log(await test(10000, 1));
console.log("(10000, 10)");
console.log(await test(10000, 10));
console.log("(10000, 20)");
console.log(await test(10000, 20));
console.log("(10000, 100)");
console.log(await test(10000, 100));
console.log("(10000, 200)");
console.log(await test(10000, 200));
console.log("(10000, 300)");
console.log(await test(10000, 300));
console.log("(10000, 400)");
console.log(await test(10000, 400));
console.log("(10000, 500)");
console.log(await test(10000, 500));
console.log("(10000, 1000)");
console.log(await test(10000, 1000));
console.log("(10000, 2000)");
console.log(await test(10000, 2000));
console.log("(10000, 3000)");
console.log(await test(10000, 3000));
console.log("(10000, 4000)");
console.log(await test(10000, 4000));
console.log("(10000, 5000)");
console.log(await test(10000, 5000));
console.log("(10000, 10000)");
console.log(await test(10000, 10000));
