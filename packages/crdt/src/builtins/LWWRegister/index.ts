export class LWWRegister<T> {
    private _element: T;
    private _timestamp: number;
    private _replicaId: number;

    constructor(element: T, replicaId: number) {
        this._element = element;
        this._replicaId = replicaId;
        this._timestamp = Date.now();
    }

    assign(element: T, replicaId: number): void {
        const timestamp = Date.now();
        if(timestamp > this._timestamp || (timestamp === this._timestamp && replicaId > this._replicaId)) {
            this._element = element;
            this._timestamp = timestamp;
            this._replicaId = replicaId;
        }
    }

    getElement(): T {
        return this._element;
    }

    getReplicaId(): number {
        return this._replicaId;
    }

    getTimestamp(): number {
        return this._timestamp;
    }

    compare(register: LWWRegister<T>): boolean {
        return (this._timestamp <= register.getTimestamp());
    }

    merge(register: LWWRegister<T>): void {
        if(register.getTimestamp() > this._timestamp || (register.getTimestamp() === this._timestamp && register.getReplicaId() > this._replicaId)) {
            this._element = register.getElement();
            this._timestamp = register.getTimestamp();
            this._replicaId = register.getReplicaId();
        }
    }
}