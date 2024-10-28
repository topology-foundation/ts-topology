import { PeerId } from "@libp2p/interface";
import { type KadDHT } from "@libp2p/kad-dht";
import { toString as uint8ArrayToString } from "uint8arrays";
import { fromString as uint8ArrayFromString } from "uint8arrays";

export class TopologyDHT {
	private _dht: KadDHT;

	constructor(dht: KadDHT, peerId: PeerId) {
		this._dht = dht;
	}

	/*
	 * Announce the peer on the DHT
	 * @param topic The topic to announce the peer on
	 * @param peer_id The peer to announce
	 * @returns nothing
	 * */

	async announcePeer(topic: string, peer_id: PeerId): Promise<void> {
		const peersSet = await this.getPeersOnTopic(topic);
		peersSet.add(peer_id);
		const newPeers = JSON.stringify(Array.from(peersSet));
		const newPeersUint8 = uint8ArrayFromString(newPeers);
		const uint8Topic = uint8ArrayFromString(topic);
		await this._putDataOnDHT(uint8Topic, newPeersUint8);
	}

	/*
	 * Get the peers on a topic from the DHT
	 * @param topic The topic to get the peers from
	 * @returns A set of PeerId
	 * */
	async getPeersOnTopic(topic: string): Promise<Set<PeerId>> {
		const uint8Topic = uint8ArrayFromString(topic);
		const peersOnTopic = this._dht?.get(uint8Topic);
		let peersSet = new Set<PeerId>();
		if (peersOnTopic) {
			for await (const evt of peersOnTopic) {
				if (evt.name === "VALUE") {
					const uint8Peers = evt.value;
					const peersArray = JSON.parse(uint8ArrayToString(uint8Peers));
					peersSet = new Set(peersArray);
				}
			}
		}
		return peersSet;
	}

	/*
	 * Remove the peer from the DHT
	 * @param topic The topic to remove the peer from
	 * @param peer_id The peer to remove
	 * @returns nothing
	 * */
	async removePeer(topic: string, peerId: PeerId): Promise<void> {
		const peersSet = await this.getPeersOnTopic(topic);
		peersSet.delete(peerId);
		const newPeers = JSON.stringify(Array.from(peersSet));
		const newPeersUint8 = uint8ArrayFromString(newPeers);
		const uint8Topic = uint8ArrayFromString(topic);
		await this._putDataOnDHT(uint8Topic, newPeersUint8);
	}

	private async _putDataOnDHT(
		key: Uint8Array,
		value: Uint8Array,
	): Promise<boolean> {
		if (!this._dht) {
			console.error(
				"topology::network::topic::discovery: DHT not initialized. Please run .start()",
			);
			return false;
		}

		try {
			await this._dht?.put(key, value);
			return true;
		} catch (e) {
			throw new Error(
				"topology::network::topic::discovery: Error storing data on DHT : " + e,
			);
			return false;
		}
	}

	private async _getDataFromDHT(
		key: Uint8Array,
	): Promise<Uint8Array | null | undefined> {
		if (!this._dht) {
			console.error(
				"topology::network::topic::discovery: DHT not initialized. Please run .start()",
			);
			return null;
		}

		try {
			const value = await this._dht?.get(key);
			for await (const evt of value) {
				if (evt.name === "VALUE") {
					return evt.value;
				}
			}
		} catch (e) {
			throw new Error(
				"topology::network::topic::discovery: Error fetching data from DHT : " +
					e,
			);
			return null;
		}
	}
}
