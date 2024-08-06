type VPointer = {
    sequence: number[],
    nodeId: string
};

type Vertex<T> = {
    vPointer: VPointer,
    element: T
};

export class LSeq<T> {
    private _vertices: Vertex<T>[];
    private _nodeId: string;

    constructor(nodeId: string) {
        this._nodeId = nodeId;
        this._vertices = [];
    }

    getVertices(): Vertex<T>[] {
        return this._vertices;
    }

    getNodeId(): string {
        return this._nodeId;
    }

    insert(index: number, element: T): void {
        const left = index === 0 ? [] : this._vertices[index - 1].vPointer.sequence;
        const right = index === this._vertices.length ? [] : this._vertices[index].vPointer.sequence;
        const pointer = { sequence: generateSeq(left, right), nodeId: this._nodeId };
        const idx = this._vertices.findIndex( vertex => compareSeq(vertex.vPointer.nodeId, pointer.nodeId,vertex.vPointer.sequence, pointer.sequence) >= 0);
        const newVertices = this._vertices;
        newVertices.splice(idx >= 0 ? idx  : this._vertices.length, 0, { vPointer: pointer, element: element });
        this._vertices = newVertices;
    }

    delete(index: number): void {
        const newVertices = this._vertices;
        if (index >= 0 && index < newVertices.length) {
            newVertices.splice(index, 1);
        }
        this._vertices = newVertices;
    }

    query(): T[] {
        return this._vertices.map(({ element }) => element);
    }

    merge(otherLSeq: LSeq<T>): void {
        const newVertices = this._vertices;
        otherLSeq.getVertices().forEach((value) => {
            if(!newVertices.some( vertex => vertex.vPointer === value.vPointer)) {
                const idx = otherLSeq.getVertices().findIndex( vertex => compareSeq(vertex.vPointer.nodeId, value.vPointer.nodeId, vertex.vPointer.sequence, value.vPointer.sequence) == 0);
                newVertices.splice(idx >= 0 ? idx: this._vertices.length,0, value);
            }
        });
        this._vertices = newVertices;
    }
}

function compareSeq(id1: string, id2: string, seq1: number[], seq2: number[]): number {
    const len = Math.min(seq1.length, seq2.length);
    for (let i = 0; i < len; i++) {
        if (seq1[i] !== seq2[i]) {
            return seq1[i] - seq2[i];
        }
    }
    let cmp = seq1.length - seq2.length;
    if(cmp === 0 ){
        cmp = id1.localeCompare(id2);
    }
    return cmp;
}

function generateSeq(lo: number[], hi: number[]): number[] {
    let array: number[] = [];
    let i = 0;
    while (true) {
        const min = i >= lo.length ? 0 : lo[i];
        const max = i >= hi.length ? 255 : hi[i];
        if (min + 1 < max) {
            array.push(min + 1);
            return array;
        } else {
            array.push(min);
            i++;
        }
    }
}