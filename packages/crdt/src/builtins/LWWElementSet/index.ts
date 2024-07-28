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

        const addTimestamp = this._adds.get(element);
        const removeTimestamp = this._removes.get(element);

        if (addTimestamp !== undefined) {
            if (removeTimestamp === undefined || addTimestamp > removeTimestamp || (addTimestamp-removeTimestamp === 0 && this._bias === Bias.ADD)) {
                return true;
            }
        }
        return false;
    }

    add(element: T): void {
        this._adds.set(element, Date.now());
    }

    remove(element: T): void {
        this._removes.set(element, Date.now());
    }

    getAdds(): Map<T, number> {
        return this._adds;
    }

    getRemoves(): Map<T, number> {
        return this._removes;
    }

    compare(peerSet: LWWElementSet<T>): boolean {
        const adds = new Set(this._adds.keys());
        const rems = new Set(this._removes.keys());
        const otherAdds = new Set(peerSet._adds.keys());
        const otherRems = new Set(peerSet._removes.keys());

        return (compareSets(adds, otherAdds) && compareSets(rems, otherRems));

    }

    merge(peerSet: LWWElementSet<T>): void {

        for (let [element, timestamp] of peerSet._adds.entries()) {
            const thisTimestamp = this._adds.get(element);
            if (!thisTimestamp || thisTimestamp < timestamp) {
                this._adds.set(element, timestamp);
            }
        }

        for (let [element, timestamp] of peerSet._removes.entries()) {
            const thisTimestamp = this._removes.get(element);
            if (!thisTimestamp || thisTimestamp < timestamp) {
                this._removes.set(element, timestamp);
            }
        }
    }
}

function compareSets<T>(set1: Set<T>, set2: Set<T>): boolean {
    return (set1.size == set2.size && [...set1].every(value => set2.has(value)));
}