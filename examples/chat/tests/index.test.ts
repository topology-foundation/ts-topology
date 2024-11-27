import { TopologyNode } from "@topology-foundation/node";
import type { TopologyObject } from "@topology-foundation/object";
import { Chat } from "../src/objects/chat";

const alice_node = new TopologyNode({
	network_config: {
		log_config: {
			level: "error",
		},
	},
});
const bob_node = new TopologyNode({
	network_config: {
		log_config: {
			level: "error",
		},
	},
});

let alice_object: TopologyObject;
let alice_cro: Chat;

let bob_object: TopologyObject;
let bob_cro: Chat;


function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function main() {
	await alice_node.start();
	await bob_node.start();

	alice_object = await alice_node.createObject(new Chat());
	alice_cro = alice_object.cro as Chat;

    alice_cro.addMessage(
        Date.now().toString(),
        "Hello World",
        alice_node.networkNode.peerId,
    );

    await timeout(30000);

    bob_object = await bob_node.createObject(new Chat(), alice_object.id, undefined, true);
    bob_cro = bob_object.cro as Chat;

    await timeout(20000);

    bob_node.syncObject(alice_object.id, alice_node.networkNode.peerId);
}

main();
