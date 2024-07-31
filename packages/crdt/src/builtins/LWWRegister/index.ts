type Timestamp = [timestamp: number, replicaId: string];

export class LWWRegister<T> {
    private _element: T;
    private _timestamp: Timestamp;
    

    constructor(element: T, replicaId: string) {
        this._element = element;
        this._timestamp = [Date.now(), replicaId];
    }

    assign(element: T, replicaId: string): void {
        const timestamp = Date.now();
        if(compareTimestamps(this._timestamp, [timestamp, replicaId])) {
            this._element = element;
            this._timestamp = [timestamp, replicaId];
        }
    }

    getElement(): T {
        return this._element;
    }

    getTimestamp(): Timestamp {
        return this._timestamp;
    }

    compare(register: LWWRegister<T>): boolean {
        return (this._timestamp <= register.getTimestamp());
    }

    merge(register: LWWRegister<T>): void {
        if(compareTimestamps(this._timestamp, register.getTimestamp())) {
            this._element = register.getElement();
            this._timestamp = register.getTimestamp();
        }
    }
}

function compareTimestamps(thisTimestamp: Timestamp, otherTimestamp: Timestamp): boolean {
    return (otherTimestamp[0] > thisTimestamp[0] || (otherTimestamp[0] === thisTimestamp[0] && otherTimestamp[1] > thisTimestamp[1]));
}