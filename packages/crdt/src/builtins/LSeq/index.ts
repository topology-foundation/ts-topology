type VPointer = {
    sequence: number[],
    id: string
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

    insert(index: number, content: T): void {
        const left = index === 0 ? [] : this._vertices[index - 1].vPointer.sequence;
        const right = index === this._vertices.length ? [] : this._vertices[index].vPointer.sequence;
        const pointer = { sequence: generateSeq(left, right), id: this._nodeId };
        const idx = this._vertices.findIndex( vertex => compareSeq(vertex.vPointer.sequence, pointer.sequence) >= 0);
        const newVertices = this._vertices;
        newVertices.splice(idx >= 0 ? idx  : this._vertices.length, 0, { vPointer: pointer, element: content });
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
                newVertices.splice(otherLSeq._vertices.indexOf(value),0, value);
            }
        });
        this._vertices = newVertices;
    }
}

function compareSeq(seq1: number[], seq2: number[]): number {
    const len = Math.min(seq1.length, seq2.length);
    for (let i = 0; i < len; i++) {
        if (seq1[i] !== seq2[i]) {
            return seq1[i] - seq2[i];
        }
    }
    return seq1.length - seq2.length;
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