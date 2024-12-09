import type { GossipsubMessage } from "@chainsafe/libp2p-gossipsub";
import type { EventCallback, Stream, StreamHandler } from "@libp2p/interface";
import {
	type TopologyNetworkNode,
	uint8ArrayToStream,
} from "@topology-foundation/network";
import { Message } from "@topology-foundation/network/dist/src/proto/topology/network/messages_pb.js";

class NetworkStats {
	bytesTransmitted = 0;
	roundTrips = 0;
}

export const globalNetworkStats = new NetworkStats();

class MockDuplex {
	generator: AsyncGenerator<Uint8Array> | undefined;
	pipeTarget: EventTarget;
	sink: (source: AsyncGenerator<Uint8Array>) => Promise<void>;
	source: () => AsyncGenerator<Uint8Array<ArrayBufferLike>>;
	protocol: string;

	constructor(protocol: string) {
		this.generator = undefined;
		this.pipeTarget = new EventTarget();
		this.sink = async (source: AsyncGenerator<Uint8Array>) => {
			this.generator = source;
			this.pipeTarget.dispatchEvent(new Event("stop"));
		};
		this.source = () =>
			(async function* (duplex: MockDuplex) {
				if (duplex.generator === undefined) {
					await new Promise((resolve, reject) => {
						duplex.pipeTarget.addEventListener("stop", (event) => {
							resolve(undefined);
						});
					});
				}
				for await (const buf of duplex.generator as AsyncGenerator<Uint8Array>) {
					yield buf;
					globalNetworkStats.bytesTransmitted += buf.length;
				}
				globalNetworkStats.roundTrips += 1;
			})(this);
		this.protocol = protocol;
	}
}

export class MockNetwork {
	nodes: MockNetworkNode[] = [];
	availableNodes: Set<string>;
	pubsubMap: Map<string, Set<MockNetworkNode>>;
	target: EventTarget;
	groupTarget: EventTarget;

	constructor() {
		this.nodes = [];
		this.availableNodes = new Set();
		this.pubsubMap = new Map();
		this.target = new EventTarget();
		this.groupTarget = new EventTarget();
	}

	dispatchEvent(event: Event) {
		if (!this.availableNodes.has(event.type)) {
			return;
		}
		this.target.dispatchEvent(event);
	}

	dispatchGroupEvent(sender: string, topic: string, event: Event) {
		const subscribers = this.pubsubMap.get(topic) ?? [];
		for (const node of subscribers) {
			if (!this.availableNodes.has(node.peerId) || node.peerId === sender) {
				continue;
			}
			node.dispatchEvent(event);
		}
	}
}

class MockNetworkNode extends EventTarget {
	network: MockNetwork;
	peerId: string;

	constructor(network: MockNetwork, peerId: string) {
		super();
		this.network = network;
		this.peerId = peerId;

		this.network.nodes.push(this);
	}

	handle(protocol: string, handle: StreamHandler) {
		this.network.target.addEventListener(this.peerId, (event) => {
			handle((event as CustomEvent).detail);
		});
	}

	newStream(peerId: string, protocol: string): MockDuplex {
		for (const node of this.network.nodes) {
			if (node.peerId === peerId) {
				const duplex = new MockDuplex(protocol);
				this.network.dispatchEvent(
					new CustomEvent(peerId, { detail: { stream: duplex } }),
				);
				return duplex;
			}
		}
		throw Error("Peer not found");
	}

	subscribe(topic: string): void {
		const subscribers =
			this.network.pubsubMap.get(topic) ?? new Set<MockNetworkNode>();
		subscribers.add(this);
		this.network.pubsubMap.set(topic, subscribers);
	}

	unsubscribe(topic: string): void {
		const subscribers =
			this.network.pubsubMap.get(topic) ?? new Set<MockNetworkNode>();
		subscribers.delete(this);
		this.network.pubsubMap.set(topic, subscribers);
	}

	getSubscribers(topic: string): string[] {
		const subscribers = this.network.pubsubMap.get(topic) ?? [];
		return Array.from(subscribers)
			.map((node) => node.peerId)
			.filter((id) => id !== this.peerId);
	}

	getPeers(): string[] {
		return this.network.nodes
			.map((node) => node.peerId)
			.filter((id) => id !== this.peerId);
	}

	publish(topic: string, message: Uint8Array): void {
		this.network.dispatchGroupEvent(
			this.peerId,
			topic,
			new CustomEvent("gossipsub:message", {
				detail: { msg: { topic, data: message } },
			}),
		);
	}
}

export class MockTopologyNetworkNode implements TopologyNetworkNode {
	private _mockNode?: MockNetworkNode;

	network: MockNetwork;
	peerId = "";

	constructor(network: MockNetwork, peerId: string) {
		this.network = network;
		this.peerId = peerId;
		this._mockNode = new MockNetworkNode(network, this.peerId);
	}

	async start() {
		this.network.availableNodes.add(this.peerId);
	}

	async stop() {
		this.network.availableNodes.delete(this.peerId);
	}

	subscribe(topic: string): void {
		this._mockNode?.subscribe(topic);
	}

	unsubscribe(topic: string): void {
		this._mockNode?.unsubscribe(topic);
	}

	getAllPeers(): string[] {
		return this._mockNode?.getPeers() ?? [];
	}

	getGroupPeers(group: string): string[] {
		return this._mockNode?.getSubscribers(group) ?? [];
	}

	async broadcastMessage(topic: string, message: Message): Promise<void> {
		const messageBuffer = Message.encode(message).finish();
		this._mockNode?.publish(topic, messageBuffer);
	}

	async sendMessage(
		peerId: string,
		protocols: string[],
		message: Message,
	): Promise<void> {
		const stream = this._mockNode?.newStream(peerId, protocols[0]);
		const messageBuffer = Message.encode(message).finish();
		uint8ArrayToStream(<Stream>(<unknown>stream), messageBuffer);
	}

	async sendGroupMessageRandomPeer(
		group: string,
		protocols: string[],
		message: Message,
	): Promise<void> {
		const peers = this._mockNode?.getSubscribers(group) ?? [];
		if (peers.length === 0) {
			throw Error("Topic wo/ peers");
		}
		const peerId = peers[Math.floor(Math.random() * peers.length)];

		const stream = this._mockNode?.newStream(peerId, protocols[0]);
		const messageBuffer = Message.encode(message).finish();
		uint8ArrayToStream(<Stream>(<unknown>stream), messageBuffer);
	}

	addGroupMessageHandler(
		group: string,
		handler: EventCallback<CustomEvent<GossipsubMessage>>,
	): void {
		this._mockNode?.addEventListener("gossipsub:message", (e) => {
			if (group && (e as CustomEvent).detail.msg.topic !== group) return;
			handler(e as CustomEvent);
		});
	}

	addMessageHandler(protocol: string | string[], handler: StreamHandler): void {
		this._mockNode?.handle(protocol[0], handler);
	}
}
