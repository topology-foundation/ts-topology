/// Replicable Growable Array (RGA) CRDT
type Identifier = { counter: number; nodeId: string };

class RGAElement<T> {
	// Virtual identifier of the element
	vid: Identifier;
	value: T | null;
	parent: Identifier | null;
	isDeleted: boolean;

	constructor(
		vid: Identifier,
		value: T | null,
		parent: Identifier | null,
		isDeleted = false,
	) {
		this.vid = vid;
		this.value = value;
		this.parent = parent;
		this.isDeleted = isDeleted;
	}
}

export class RGA<T> {
	/// The sequencer is used to generate unique identifiers for each element
	sequencer: Identifier;
	/// For now we are using a simple array to store elements
	/// This can be optimized using a Btree
	elements: RGAElement<T>[];

	/* 
		We are using an empty element as the head of the array to simplify the logic of merging two RGA instances.
		It acts as an anchor and is the same for all replicas.
	*/
	constructor(
		nodeId: string,
		sequencer: Identifier = { counter: 0, nodeId: nodeId },
		elements: RGAElement<T>[] = [
			new RGAElement<T>({ counter: 0, nodeId: "" }, null, null, true),
		],
	) {
		this.sequencer = sequencer;
		this.elements = elements;
	}

	getArray(): T[] {
		return this.elements
			.filter((element) => !element.isDeleted)
			.map((element) => element.value! as T);
	}

	clear(): void {
		this.sequencer = { counter: 0, nodeId: this.sequencer.nodeId };
		this.elements = [
			new RGAElement<T>({ counter: 0, nodeId: "" }, null, null, true),
		];
	}

	// Function to generate the next unique identifier
	private nextSeq(sequencer: Identifier): Identifier {
		return { counter: sequencer.counter + 1, nodeId: sequencer.nodeId };
	}

	// Check whether a < b, ids are never equal
	private compareVIds(a: Identifier, b: Identifier): boolean {
		if (a.counter !== b.counter) {
			return a.counter < b.counter;
		}
		return a.nodeId < b.nodeId;
	}

	// Function to map a logical index (ignoring tombstones) to a physical index in the elements array
	private indexWithTombstones(index: number): number {
		let offset = 1; // Start from 1 to skip the head element
		while (index > 0) {
			if (!this.elements[offset].isDeleted) index--;
			offset++;
		}
		return offset;
	}

	// Function to read the value at a given index
	read(index: number): T | null {
		let i = this.indexWithTombstones(index);
		while (this.elements[i].isDeleted) i++;
		return this.elements[i].value;
	}

	// Function to find the physical index of an element given the virtual id
	private indexOfVId(ptr: Identifier): number {
		for (let offset = 0; offset < this.elements.length; offset++) {
			if (
				ptr.counter === this.elements[offset].vid.counter &&
				ptr.nodeId === this.elements[offset].vid.nodeId
			) {
				return offset;
			}
		}
		return -1;
	}

	// Function to insert a new element after a given index, might not be immidiately after becuase we look at parents
	insert(parentIndex: number, value: T): void {
		const i = this.indexWithTombstones(parentIndex);
		const parent = this.elements[i - 1].vid;
		const newVId = this.nextSeq(this.sequencer);
		this.insertElement(new RGAElement(newVId, value, parent));
	}

	// Function to insert a new element into the array
	private insertElement(element: RGAElement<T>): void {
		const parentIdx = this.indexOfVId(element.parent!);
		let insertIdx = parentIdx + 1;
		for (; insertIdx < this.elements.length; insertIdx++) {
			const curr = this.elements[insertIdx];
			const currParentIdx = this.indexOfVId(curr.parent!);
			if (currParentIdx > parentIdx) break;
			if (currParentIdx === parentIdx) {
				if (this.compareVIds(curr.vid, element.vid)) break;
			}
		}
		this.sequencer = {
			...this.sequencer,
			counter: Math.max(this.sequencer.counter, element.vid.counter),
		};
		// Check if its a duplicate
		if (
			this.elements[insertIdx - 1].vid.counter === element.vid.counter &&
			this.elements[insertIdx - 1].vid.nodeId === element.vid.nodeId
		) {
			return;
		}
		this.elements.splice(insertIdx, 0, element);
	}

	// Function to delete an element from the RGA
	delete(index: number): void {
		let i = this.indexWithTombstones(index);
		while (this.elements[i].isDeleted) i++;
		this.elements[i].isDeleted = true;
	}

	// Function to update the value of an element
	update(index: number, value: T): void {
		let i = this.indexWithTombstones(index);
		while (this.elements[i].isDeleted) i++;
		this.elements[i].value = value;
	}

	// Merge another RGA instance into this one
	merge(peerRGA: RGA<T>): void {
		for (let i = 1; i < peerRGA.elements.length; i++) {
			this.insertElement(peerRGA.elements[i]);
		}

		this.sequencer = {
			...this.sequencer,
			counter: Math.max(this.sequencer.counter, peerRGA.sequencer.counter),
		};
	}
}
