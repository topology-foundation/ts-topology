/* GMap with support for state and op changes */
export class GMap<K, V> {
	map: Map<K, V>;

	constructor(map: Map<K, V> = new Map<K, V>()) {
		this.map = map;
	}

	add(key: K, value: V): void {
		if (!this.map.has(key)) {
			this.map.set(key, value);
		}
	}

	get(key: K): V | undefined {
		return this.map.get(key);
	}

	has(key: K): boolean {
		return this.map.has(key);
	}

	compare(peerMap: GMap<K, V>): boolean {
		if (this.map.size !== peerMap.map.size) return false;
		for (const [key, value] of this.map) {
			if (!peerMap.map.has(key) || peerMap.map.get(key) !== value) {
				return false;
			}
		}
		return true;
	}

	merge(peerMap: GMap<K, V>): void {
		for (const [key, value] of peerMap.map) {
			if (!this.map.has(key)) {
				this.map.set(key, value);
			}
		}
	}
}

/// AssemblyScript functions
export function gmap_create<K, V>(map: Map<K, V> = new Map<K, V>()): GMap<K, V> {
	return new GMap<K, V>(map);
}

export function gmap_add<K, V>(gmap: GMap<K, V>, key: K, value: V): void {
	gmap.add(key, value);
}

export function gmap_get<K, V>(gmap: GMap<K, V>, key: K): V | undefined {
	return gmap.get(key);
}

export function gmap_has<K, V>(gmap: GMap<K, V>, key: K): boolean {
	return gmap.has(key);
}

export function gmap_compare<K, V>(gmap: GMap<K, V>, peerMap: GMap<K, V>): boolean {
	return gmap.compare(peerMap);
}

export function gmap_merge<K, V>(gmap: GMap<K, V>, peerMap: GMap<K, V>): void {
	gmap.merge(peerMap);
}
