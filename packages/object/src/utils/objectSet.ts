export class ObjectSet<T extends string | number | symbol> {
	set: { [key in T]: boolean };

	constructor(iterable: Iterable<T> = []) {
		this.set = {} as { [key in T]: boolean };
		for (const item of iterable) {
			this.set[item] = true;
		}
	}

	add(item: T): void {
		this.set[item] = true;
	}

	delete(item: T): void {
		delete this.set[item];
	}

	has(item: T): boolean {
		return this.set[item] === true;
	}

	entries(): Array<T> {
		return Object.keys(this.set) as Array<T>;
	}
}
