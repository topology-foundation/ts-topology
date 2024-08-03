/// Replicable Growable Array (RGA) CRDT
type Identifier = { counter: number; nodeId: string };

class RGAElement<T> {
    public id: Identifier;
    public value: T | null;

    constructor(id: Identifier, value: T | null) {
        this.id = id;
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

    getElements(): T[] {
        return this._elements
            .filter((element) => element.value !== null)
            .map((element) => element.value! as T);
    }

    clear(): void {
        this._sequencer = { counter: 0, nodeId: this._sequencer.nodeId };
        this._elements = [
            new RGAElement<T>({ counter: 0, nodeId: "" }, null),
        ]
    }

    isTombstone(element: RGAElement<T>): boolean {
        return element.value === null;
    }

    nextSeqNr(sequencer: Identifier): Identifier {
        return { counter: sequencer.counter + 1, nodeId: sequencer.nodeId };
    }

    // Function to map a logical index (ignoring tombstones) to a physical index in the elements array
    indexWithTombstones(index: number): number {
        // Start from 1 to skip the head element
        let offset = 1;
        while (index >= 0 && offset < this._elements.length) {
            if(index === 0 && !this.isTombstone(this._elements[offset])) break;
            if (!this.isTombstone(this._elements[offset])) index--;
            offset++;
        }
        if (index > 0) {
            throw new RangeError("Index not found");
        }
        return offset;
    }

    read(index: number): T | null {
        const i = this.indexWithTombstones(index);
        return this._elements[i].value;
    }

    // Function to find the physical index of a vertex given its virtual pointer
    indexOfVPtr(ptr: Identifier): number {
        for (let offset = 0; offset < this._elements.length; offset++) {
            if (
                ptr.counter === this._elements[offset].id.counter &&
                ptr.nodeId === this._elements[offset].id.nodeId
            ) {
                return offset;
            }
        }
        throw new RangeError("Index not found");
    }

    // Function to find the correct insertion point for a new vertex
    shift(offset: number, ptr: Identifier): number {
        while (offset < this._elements.length) {
            const next: Identifier = this._elements[offset].id;
            if (
                next.counter < ptr.counter ||
                (next.counter === ptr.counter && next.nodeId < ptr.nodeId)
            ) {
                return offset;
            }
            offset++;
        }
        return offset;
    }

    // Function to insert a new vertex in the graph
    insert(index: number, value: T): void {
        const i = this.indexWithTombstones(index);
        const predecessor = this._elements[i - 1].id;
        const ptr = this.nextSeqNr(this._sequencer);

        const predecessorIdx = this.indexOfVPtr(predecessor);
        const insertIdx = this.shift(predecessorIdx + 1, ptr);
        this._sequencer = {
            counter: Math.max(this._sequencer.counter, ptr.counter),
            nodeId: this._sequencer.nodeId,
        };
        this._elements.splice(insertIdx, 0, new RGAElement(ptr, value));
    }

    // Function to delete a vertex from the graph
    delete(index: number): void {
        const i = this.indexWithTombstones(index);
        const ptr = this._elements[i].id;
        index = this.indexOfVPtr(ptr);
        this._elements[index].value = null;
    }

    // Function to update the value of a vertex
    update(index: number, value: T): void {
        const i = this.indexWithTombstones(index);
        this._elements[i].value = value;
    }

    // Merge another RGA instance into this one
    merge(peerRGA: RGA<T>): void {
        const newVertices: RGAElement<T>[] = [];
       
        for (let i = 1; i < peerRGA._elements.length; i++) {
            this.insert(i, peerRGA._elements[i].value!);
        }

        // Deduplicate and merge the vertices
        const seen: Set<string> = new Set();
        for (const vertex of this._elements) {
            const key = `${vertex.id.counter}_${vertex.id.nodeId}`;
            if (!seen.has(key)) {
                newVertices.push(vertex);
                seen.add(key);
            } else {
                const existingIndex = newVertices.findIndex(
                    (v) =>
                        v.id.counter === vertex.id.counter &&
                        v.id.nodeId === vertex.id.nodeId
                );
                if (existingIndex !== -1 && vertex.value === null) {
                    newVertices[existingIndex].value = null; // Ensure tombstone is applied
                }
            }
        }

        this._elements = newVertices;
        this._sequencer = {
            counter: Math.max(this._sequencer.counter, peerRGA._sequencer.counter),
            nodeId: this._sequencer.nodeId,
        };
    }
}
