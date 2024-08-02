type VPointer = {
    sequence: Uint8Array,
    id: string
};

type Vertex<T> = {
    vPointer: VPointer,
    element: T
}

export class LSeq<T> {

    private _vertices: Array<Vertex<T>>;

    constructor() {
        this._vertices = new Array<Vertex<T>>();
    }

    insert(replicaId: string, index: number, content: T): void {
        const left = index == 0 ? new Uint8Array() : this._vertices[index - 1].vPointer.sequence;
        const right = index == this._vertices.length ? new Uint8Array() : this._vertices[index].vPointer.sequence;
        const pointer = {sequence: generateSeq(left, right), id: replicaId};
        this._vertices.splice(index, 0, {vPointer: pointer, element: content});
    }

    delete(index: number): void {
        if(index >= 0 && index < this._vertices.length) {
            this._vertices.splice(index, 1);
        }
    }

    query(): T[] {
        return this._vertices.map(( {element}) => element);
    }
}

// Compare virtual pointers
function compareVPointers(vptr1: VPointer, vptr2: VPointer): number {
    return 0;
}

// Generates sequence
function generateSeq(lo: Uint8Array, hi: Uint8Array): Uint8Array {
    let array: number[] = [];
    let i = 0;
    while(true) {
        let min = i >= lo.length ? 0 : lo[i];
        let max = i >= hi.length ? 255 : hi[i];
        if(min + 1 < max) {
            array.push(min + 1);
            return new Uint8Array(array);
        } else {
            array.push(min);
            i++;
        }
    }
}