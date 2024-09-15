import type { GCounter } from "../GCounter/index.js";

/// State-based PNCounter
export class PNCounter {
	private _increments: GCounter;
	private _decrements: GCounter;

	constructor(increments: GCounter, decrements: GCounter) {
		this._increments = increments;
		this._decrements = decrements;
	}

	value(): number {
		return this._increments.value() - this._decrements.value();
	}

	increments(): GCounter {
		return this._increments;
	}

	decrements(): GCounter {
		return this._decrements;
	}

	increment(nodeId: string, amount: number): void {
		this._increments.increment(nodeId, amount);
	}

	decrement(nodeId: string, amount: number): void {
		this._decrements.increment(nodeId, amount);
	}

	compare(peerCounter: PNCounter): boolean {
		return (
			this._increments.compare(peerCounter.increments()) &&
			this._decrements.compare(peerCounter.decrements())
		);
	}

	merge(peerCounter: PNCounter): void {
		this._increments.merge(peerCounter.increments());
		this._decrements.merge(peerCounter.decrements());
	}
}

/// AssemblyScript functions
export function pncounter_create(increments: GCounter, decrements: GCounter): PNCounter {
	return new PNCounter(increments, decrements);
}

export function pncounter_value(counter: PNCounter): number {
	return counter.value();
}

export function pncounter_increments(counter: PNCounter): GCounter {
	return counter.increments();
}

export function pncounter_decrements(counter: PNCounter): GCounter {
	return counter.decrements();
}

export function pncounter_increment(counter: PNCounter, nodeId: string, amount: number): void {
	counter.increment(nodeId, amount);
}

export function pncounter_decrement(counter: PNCounter, nodeId: string, amount: number): void {
	counter.decrement(nodeId, amount);
}

export function pncounter_compare(counter: PNCounter, peerCounter: PNCounter): boolean {
	return counter.compare(peerCounter);
}

export function pncounter_merge(counter: PNCounter, peerCounter: PNCounter): void {
	counter.merge(peerCounter);
}
