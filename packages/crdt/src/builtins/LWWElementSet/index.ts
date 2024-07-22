interface Element {
    bias: Bias,
    timestamp: number
}

enum Bias {
    ADD,
    REMOVE
}

export class LWWElementSet<T> {
    private _adds: Map<T, Element>;
    private _removes: Map<T, Element>;

    constructor(adds: Map<T, Element>, removes: Map<T, Element>) {
        this._adds = adds;
        this._removes = removes;
    }
    // check for timestamps
    lookup(element: T): boolean {

        const addElemInfo = this._adds.get(element);
        const remElemInfo = this._removes.get(element);

        if (addElemInfo !== undefined &&
            (remElemInfo === undefined || addElemInfo.timestamp > remElemInfo.timestamp)) {
            return true;
        }
        return false;
    }

    add(element: T, timestamp: number, bias: Bias): void {
        this._adds.set(element, { timestamp, bias });
    }

    remove(element: T, timestamp: number, bias: Bias): void {
        this._adds.set(element, { timestamp, bias });
    }

    getAdds(): Map<T, Element> {
        return this._adds;
    }

    getRemoves(): Map<T, Element> {
        return this._removes;
    }

    compare(peerSet: LWWElementSet<T>): boolean {
        return (
            this._adds.entries() == peerSet._adds.entries() &&
            this._removes.entries() == peerSet._removes.entries()
        );
    }

    merge(peerSet: LWWElementSet<T>): void {

        for (let e of peerSet._adds.entries()) {
            if (!this._adds.has(e[0]) || this.compareTimestamp(this._adds.get(e[0])!, e[1])) {
                this._adds.set(e[0], e[1]);
            }
        }

        for (let e of peerSet._removes.entries()) {
            if (!this._removes.has(e[0]) || this.compareTimestamp(this._removes.get(e[0])!, e[1])) {
                this._removes.set(e[0], e[1]);
            }
        }

    }

    compareTimestamp(thisElem: Element, other: Element) {

        const timestampComparison = thisElem.timestamp - other.timestamp;

        if (timestampComparison === 0) {
            return thisElem.bias !== Bias.ADD;
        }
        return timestampComparison < 0;
    }
}