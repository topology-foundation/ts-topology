interface ElementTuple<T> {
    element: T,
    tag: number,
    replicaId: string
}

export class ORSet<T> {
    private _elements: Set<ElementTuple<T>>;
    private _summary: Map<string, number>;
    public replicaId: string;
  
    constructor(elements: Set<ElementTuple<T>>, replicaId: string) {
        this._elements = elements;
        this.replicaId = replicaId;
        this._summary = new Map<string, number>([[this.replicaId, 0]]);
        
    }

    lookup(element: T): boolean {
        for (let elem of this._elements) {
            if (elem.element === element) {
                return true;
            }
        }
        return false;
    }

    add(element: T): void {
    
        let c:number = this._summary.get(this.replicaId)! + 1;
        this._summary.set(this.replicaId, c);
        this._elements.add({ element, tag: c, replicaId: this.replicaId });
        
    }

    remove(element: T): void {
        for (let tuple of this._elements.values()) {
            if (tuple.element === element) {
                this._elements.delete(tuple); //removes element from the elements
            }
        }
    }

    getElements(): Set<ElementTuple<T>> {
        return this._elements;
    }

    getSummary(): Map<string,number> {
        return this._summary;
    }

    //here I just compare the elements set
    compare(peerSet: ORSet<T>): boolean {
        return (this._elements.size == peerSet.getElements().size && 
            [...this._elements].every((value) => peerSet.getElements().has(value)));
    }

    merge(peerSet: ORSet<T>): void {
       
        let M = new Set<ElementTuple<T>>();
        let A = new Set<ElementTuple<T>>();
        let B = new Set<ElementTuple<T>>();

        // Adds the elements common to the two sets
        this._elements.forEach((element) => {
            if(peerSet.getElements().has(element)) {
                M.add(element);
            }
        });

        // in the local payload but not recently removed from the remote payload
        this._elements.forEach((element) => {
            if(!peerSet.getElements().has(element) && element.tag > peerSet.getSummary().get(element.replicaId)!) {
                A.add(element);
            }
        });

        //vice-versa
        peerSet.getElements().forEach((element) => {
            if(!this._elements.has(element) && element.tag > this._summary.get(element.replicaId)!) {
                B.add(element);
            }
        });

        this._elements = new Set<ElementTuple<T>>([...M,...A,...B]);

        for( let e of peerSet.getSummary().entries()) {
            this._summary.set(e[0], Math.max(e[1], this._summary.get(e[0])!));
        }
    }
}