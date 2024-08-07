export class LWWRegister<T> {
    private _element: T;
    private _timestamp: number;
    private _nodeId: string;

    constructor(element: T, nodeId: string) {
        this._element = element;
        this._timestamp = Date.now();
        this._nodeId = nodeId;
    }

    assign(element: T, nodeId: string): void {
        this._element = element;
        this._timestamp = Date.now();
        this._nodeId = nodeId;
    }

    getElement(): T {
        return this._element;
    }

    getTimestamp(): number {
        return this._timestamp;
    }

    getNodeId(): string {
        return this._nodeId;
    }

    compare(register: LWWRegister<T>): boolean {
        return (this._timestamp <= register.getTimestamp());
    }

    merge(register: LWWRegister<T>): void {
        const otherTimestamp = register.getTimestamp();
        const otherNodeId = register.getNodeId();
        if (otherTimestamp < this._timestamp) {
            return;
        }
        if (otherTimestamp === this._timestamp && otherNodeId <= this._nodeId) {
            return;
        }
        this._element = register.getElement();
        this._timestamp = otherTimestamp;
        this._nodeId = otherNodeId;
    }
}