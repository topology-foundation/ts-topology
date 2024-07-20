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

    add(element: T): void {
        let tag = uuidv4();
        this._elements.add({ element, tag });
    }

    remove(element: T): void {
        for(let tuple of this._elements.values()) {
            if(tuple.element === element) {
                this._tombstone.add(tuple); //adds element to the tombstone
                this._elements.delete(tuple); //removes element from the elements
            }
        }
    }

    elements(): Set<ElementTuple<T>> {
        return this._elements;
    }

    tombstone(): Set<ElementTuple<T>> {
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
        this._elements = new Set<ElementTuple<T>>([...this._elements, ...peerSet.elements()]);
        this._tombstone = new Set<ElementTuple<T>>([...this._tombstone, ...peerSet.tombstone()]);
    }


}