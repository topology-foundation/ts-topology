type VPointer = {
    sequence: number[],
    nodeId: string
};

type Vertex<T> = {
    vPointer: VPointer,
    element: T
};

export class LSeq<T> {
    vertices: Vertex<T>[];
    nodeId: string;

    constructor(nodeId: string) {
        this.nodeId = nodeId;
        this.vertices = [];
    }

    insert(index: number, element: T): void {
        const left = index === 0 ? [] : this.vertices[index - 1].vPointer.sequence;
        const right = index === this.vertices.length ? [] : this.vertices[index].vPointer.sequence;
        const pointer = { sequence: generateSeq(left, right), nodeId: this.nodeId };
        const idx = this.vertices.findIndex(vertex => compareSeq(vertex.vPointer.nodeId, pointer.nodeId, vertex.vPointer.sequence, pointer.sequence) >= 0);
        const newVertices = this.vertices;
        newVertices.splice(idx >= 0 ? idx : this.vertices.length, 0, { vPointer: pointer, element: element });
        this.vertices = newVertices;
    }

    delete(index: number): void {
        if (index < 0) {
            return;
        }
        if (index >= this.vertices.length) {
            return;
        }
        const newVertices = this.vertices;
        newVertices.splice(index, 1);
        this.vertices = newVertices;
    }

    list(): T[] {
        return this.vertices.map(({ element }) => element);
    }

    query(nodeId: string, sequenceNumber: number[]): Vertex<T>[] {
        return this.vertices.filter(vertex => vertex.vPointer.nodeId === nodeId && compareArrays(vertex.vPointer.sequence, sequenceNumber) == 0);
    }

    merge(otherLSeq: LSeq<T>): void {
        const newVertices = this.vertices;
        otherLSeq.vertices.forEach((value) => {
            if (!newVertices.some(vertex => vertex.vPointer === value.vPointer)) {
                const idx = otherLSeq.vertices.findIndex(vertex => compareSeq(vertex.vPointer.nodeId, value.vPointer.nodeId, vertex.vPointer.sequence, value.vPointer.sequence) == 0);
                newVertices.splice(idx >= 0 ? idx : this.vertices.length, 0, value);
            }
        });
        this.vertices = newVertices;
    }
}

function compareArrays(seq1: number[], seq2: number[]): number {
    const len = Math.min(seq1.length, seq2.length);
    for (let i = 0; i < len; i++) {
        if (seq1[i] !== seq2[i]) {
            return seq1[i] - seq2[i];
        }
    }
    return seq1.length - seq2.length;
}

function compareSeq(id1: string, id2: string, seq1: number[], seq2: number[]): number {
    let cmp = compareArrays(seq1, seq2);
    if (cmp === 0) {
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