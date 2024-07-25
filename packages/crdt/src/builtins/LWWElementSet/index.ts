export enum Bias {
    ADD,
    REMOVE
}

export class LWWElementSet<T> {
    private _adds: Map<T, number>;
    private _removes: Map<T, number>;
    public _bias: Bias;

    constructor(adds: Map<T, number>, removes: Map<T, number>, bias: Bias) {
        this._adds = adds;
        this._removes = removes;
        this._bias = bias;
    }

    lookup(element: T): boolean {

        const addElemTimestmp = this._adds.get(element);
        const remElemTimestmp = this._removes.get(element);

        if (addElemTimestmp !== undefined &&
            (remElemTimestmp === undefined || addElemTimestmp > remElemTimestmp)) {
            return true;
        }
        return false;
    }

    add(element: T, timestamp: number): void {
        this._adds.set(element, timestamp);
    }

    remove(element: T, timestamp: number): void {
        this._removes.set(element, timestamp);
    }

    getAdds(): Map<T, number> {
        return this._adds;
    }

    getRemoves(): Map<T, number> {
        return this._removes;
    }

    areSetsEqual(set1: Set<T>, set2: Set<T>): boolean {
        return (set1.size == set2.size && [...set1].every(value => set2.has(value)));
    }

    compare(peerSet: LWWElementSet<T>): boolean {
        const adds = new Set(this._adds.keys());
        const rems = new Set(this._removes.keys());
        const otherAdds = new Set(peerSet._adds.keys());
        const otherRems = new Set(peerSet._removes.keys());

        return (this.areSetsEqual(adds, otherAdds) && this.areSetsEqual(rems, otherRems));

    }

    merge(peerSet: LWWElementSet<T>): void {

        for (let element of peerSet._adds.keys()) {
            if (!this._adds.has(element) || this.compareTimestamp(this._adds.get(element)!, peerSet.getAdds().get(element)!)) {
                this._adds.set(element, peerSet.getAdds().get(element)!);
            }
        }

        for (let element of peerSet._removes.keys()) {
            if (!this._removes.has(element) || this.compareTimestamp(this._removes.get(element)!, peerSet.getRemoves().get(element)!)) {
                this._removes.set(element, peerSet.getRemoves().get(element)!);
            }
        }
    }

    private compareTimestamp(thisTime: number, otherTime: number) {

        const timestampComparison = thisTime - otherTime;

        if (timestampComparison === 0) {
            return this._bias !== Bias.ADD;
        }
        return timestampComparison < 0;
    }
}