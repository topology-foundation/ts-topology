import { v4 as uuidv4 } from 'uuid';

interface ElementTuple<T> {
    element: T,
    tag: string
}

export class ORSet<T> {
    private _elements: Set<ElementTuple<T>>;
    private _tombstone: Set<ElementTuple<T>>;

    constructor(elements: Set<ElementTuple<T>>, tombstone: Set<ElementTuple<T>>) {
        this._elements = elements;
        this._tombstone = tombstone;
    }

    lookup(element: T): boolean {
        for (let elem of this._elements) {
            if (elem.element === element) {
                if (!this._tombstone.has(elem)) {
                    return true;
                }
            }
        }
        return false;
    }

    add(element: T): void {
        let tag = uuidv4();
        this._elements.add({ element, tag });
    }

    remove(element: T): void {
        for (let tuple of this._elements.values()) {
            if (tuple.element === element) {
                this._tombstone.add(tuple); //adds element to the tombstone
                this._elements.delete(tuple); //removes element from the elements
            }
        }
    }

    getElements(): Set<ElementTuple<T>> {
        return this._elements;
    }

    getTombstone(): Set<ElementTuple<T>> {
        return this._tombstone;
    }

    compare(peerSet: ORSet<T>): boolean {
        return (
            this._elements == peerSet._elements &&
            this._tombstone == peerSet._tombstone
        );
    }

    //check if its this way
    merge(peerSet: ORSet<T>): void {

        // E \ peerSet.T
        this._elements.forEach(elem => {
            if (peerSet.getTombstone().has(elem)) {
                this._elements.delete(elem);
            }
        });

        // peerSet.E \ T 
        peerSet.getElements().forEach(elem => {
            if (!this._tombstone.has(elem)) {
                this._elements.add(elem);
            }
        });

        this._tombstone = new Set<ElementTuple<T>>([...this._tombstone, ...peerSet.getTombstone()]);
    }
}