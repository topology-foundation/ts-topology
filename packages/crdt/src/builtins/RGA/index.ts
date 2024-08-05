/// Replicable Growable Array (RGA) CRDT
type Identifier = { counter: number; nodeId: string };

class RGAElement<T> {
    // Virtual identifier of the element
    public vid: Identifier;
    public value: T | null;

    constructor(vid: Identifier, value: T | null) {
        this.vid = vid;
        /// If the value is null, the element is in the tombstone state
        this.value = value;
    }
}

export class RGA<T> {
    /// The sequencer is used to generate unique identifiers for each element
    private _sequencer: Identifier;
    /// For now we are using a simple array to store elements
    /// This can be optimized using a Btree
    private _elements: RGAElement<T>[];

    constructor(
        nodeId: string,
        sequencer: Identifier = { counter: 0, nodeId: nodeId },
        elements: RGAElement<T>[] = [
            new RGAElement<T>({ counter: 0, nodeId: "" }, null),
        ]
    ) {
        this._sequencer = sequencer;
        this._elements = elements;
    }

    elements(): RGAElement<T>[] {
        return this._elements;
    }

    getArray(): T[] {
        return this._elements
            .filter((element) => element.value !== null)
            .map((element) => element.value! as T);
    }

    clear(): void {
        this._sequencer = { counter: 0, nodeId: this._sequencer.nodeId };
        this._elements = [new RGAElement<T>({ counter: 0, nodeId: "" }, null)];
    }

    private isTombstone(element: RGAElement<T>): boolean {
        return element.value === null;
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
            if (!this.isTombstone(this._elements[offset])) index--;
            offset++;
        }
        return offset;
    }

    // Function to read the value at a given index
    read(index: number): T | null {
        let i = this.indexWithTombstones(index);
        while (this.isTombstone(this._elements[i])) i++;
        return this._elements[i].value;
    }

    // Function to find the physical index of an element given the virtual id
    private indexOfVId(ptr: Identifier): number {
        for (let offset = 0; offset < this._elements.length; offset++) {
            if (
                ptr.counter === this._elements[offset].vid.counter &&
                ptr.nodeId === this._elements[offset].vid.nodeId
            ) {
                return offset;
            }
        }
        throw new RangeError("Index not found");
    }

    // Function to find the correct insertion point for a new element
    private shift(offset: number, id: Identifier): number {
        while (offset < this._elements.length) {
            const next: Identifier = this._elements[offset].vid;
            if (this.compareVIds(next, id)) return offset;
            offset++;
        }
        return offset;
    }

    insert(index: number, value: T): void {
        const i = this.indexWithTombstones(index);
        const predecessor = this._elements[i - 1].vid;
        const newVId = this.nextSeq(this._sequencer);
        this.insertElement(predecessor, new RGAElement(newVId, value));
    }

    // Function to insert a new element into the array
    private insertElement(
        predecessor: Identifier,
        element: RGAElement<T>
    ): void {
        const predecessorIdx = this.indexOfVId(predecessor);
        const insertIdx = this.shift(predecessorIdx + 1, element.vid);
        this._sequencer = {
            counter: Math.max(this._sequencer.counter, element.vid.counter),
            nodeId: this._sequencer.nodeId,
        };
        // Check if its a duplicate
        if (
            insertIdx < this._elements.length &&
            this._elements[insertIdx].vid.counter === element.vid.counter &&
            this._elements[insertIdx].vid.nodeId === element.vid.nodeId
        ) {
            return;
        }
        this._elements.splice(insertIdx, 0, element);
    }

    // Function to delete an element from the RGA
    delete(index: number): void {
        let i = this.indexWithTombstones(index);
        while (this.isTombstone(this._elements[i])) i++;
        this._elements[i].value = null;
    }

    // Function to update the value of an element
    update(index: number, value: T): void {
        let i = this.indexWithTombstones(index);
        while (this.isTombstone(this._elements[i])) i++;
        this._elements[i].value = value;
    }

    // Merge another RGA instance into this one
    merge(peerRGA: RGA<T>): void {
        for (let i = 1; i < peerRGA.elements().length; i++) {
            this.insertElement(
                peerRGA.elements()[i - 1].vid,
                peerRGA.elements()[i]
            );
        }

        this._sequencer = {
            counter: Math.max(
                this._sequencer.counter,
                peerRGA._sequencer.counter
            ),
            nodeId: this._sequencer.nodeId,
        };
    }
}
