import { Smush32 } from "@thi.ng/random";
import { ActionType, SemanticsType, } from "@topology-foundation/object";
const MOD = 1e9 + 9;
function computeHash(s) {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        // Same as hash = hash * 31 + s.charCodeAt(i);
        hash = (hash << 5) - hash + s.charCodeAt(i);
        hash %= MOD;
    }
    return hash;
}
/*
    Example implementation of multi-vertex semantics that uses the reduce action type.
    An arbitrary number of concurrent operations can be reduced to a single operation.
    The winning operation is chosen using a pseudo-random number generator.
*/
export class PseudoRandomWinsSet {
    operations = ["add", "remove"];
    state;
    semanticsType = SemanticsType.multiple;
    constructor() {
        this.state = new Map();
    }
    _add(value) {
        if (!this.state.get(value))
            this.state.set(value, true);
    }
    add(value) {
        this._add(value);
    }
    _remove(value) {
        if (this.state.get(value))
            this.state.set(value, false);
    }
    remove(value) {
        this._remove(value);
    }
    contains(value) {
        return this.state.get(value) === true;
    }
    values() {
        return Array.from(this.state.entries())
            .filter(([_, exists]) => exists)
            .map(([value, _]) => value);
    }
    resolveConflicts(vertices) {
        vertices.sort((a, b) => (a.hash < b.hash ? -1 : 1));
        const seed = vertices.map((vertex) => vertex.hash).join("");
        const rnd = new Smush32(computeHash(seed));
        const chosen = rnd.int() % vertices.length;
        const hashes = vertices.map((vertex) => vertex.hash);
        hashes.splice(chosen, 1);
        return { action: ActionType.Drop, vertices: hashes };
    }
    // merged at HG level and called as a callback
    mergeCallback(operations) {
        this.state = new Map();
        for (const op of operations) {
            switch (op.type) {
                case "add":
                    if (op.value !== null)
                        this._add(op.value);
                    break;
                case "remove":
                    if (op.value !== null)
                        this._remove(op.value);
                    break;
                default:
                    break;
            }
        }
    }
}
