import { describe, test, expect, beforeEach } from "vitest";
import { RGA } from "../src/crdts/RGA/index.js";

describe("Replicable Growable Array Tests", () => {
	let rga: RGA<string>;
	let peerRGA: RGA<string>;

	beforeEach(() => {
		rga = new RGA<string>("node1");
		peerRGA = new RGA<string>("node2");
	});

	test("Test Insert", () => {
		rga.insert(0, "A");
		rga.insert(1, "B");
		rga.insert(1, "C");
		rga.insert(0, "D");

		expect(rga.getArray()).toEqual(["D", "A", "C", "B"]);
	});

	test("Test Read", () => {
		rga.insert(0, "A");
		rga.insert(1, "B");
		rga.insert(1, "C");
		rga.delete(1);

		expect(rga.read(0)).toBe("A");
		expect(rga.read(1)).toBe("B");
	});

	test("Test Insert and Delete", () => {
		rga.insert(0, "A");
		rga.insert(1, "B");
		rga.insert(1, "C");
		rga.delete(0);
		rga.delete(0);
		expect(rga.getArray()).toEqual(["B"]);

		rga.clear();

		rga.insert(0, "A");
		rga.insert(1, "B");
		rga.delete(0);

		expect(rga.getArray()).toEqual(["B"]);

		rga.insert(0, "C");
		rga.insert(1, "D");
		expect(rga.getArray()).toEqual(["C", "D", "B"]);

		rga.delete(1);
		expect(rga.getArray()).toEqual(["C", "B"]);

		rga.delete(1);
		expect(rga.getArray()).toEqual(["C"]);

		peerRGA.insert(0, "E");
		peerRGA.insert(0, "F");
		peerRGA.insert(2, "G");
		peerRGA.insert(3, "H");
		peerRGA.delete(1);
		peerRGA.delete(1);
		peerRGA.delete(1);
		expect(peerRGA.getArray()).toEqual(["F"]);
	});

	test("Test Update", () => {
		rga.insert(0, "A");
		rga.insert(1, "B");
		rga.update(0, "C");
		rga.update(1, "D");

		expect(rga.getArray()).toEqual(["C", "D"]);
	});

	test("Test Merge", () => {
		rga.insert(0, "A");
		rga.insert(1, "B");

		peerRGA.insert(0, "C");
		peerRGA.insert(1, "D");
		peerRGA.insert(0, "E");

		rga.merge(peerRGA);
		expect(rga.getArray()).toEqual(["E", "C", "A", "D", "B"]);

		peerRGA.merge(rga);
		expect(peerRGA.getArray()).toEqual(rga.getArray());
	});
});
