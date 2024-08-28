import { beforeEach, describe, expect, test } from "vitest";
import { AddWinsSet } from "../../crdt/src/cros/AddWinsSet/index.js";
import {
	callFn,
	newTopologyObject,
	type TopologyObject,
} from "../src/index.js";

describe("HashGraph for AddWinSet tests", () => {
	let cro1: AddWinsSet<number>;
	let obj1: TopologyObject<number>;
	let obj2: TopologyObject<number>;
	let obj3: TopologyObject<number>;

	beforeEach(async () => {
		cro1 = new AddWinsSet<number>();
		const cro2 = new AddWinsSet<number>();
		const cro3 = new AddWinsSet<number>();

		obj1 = await newTopologyObject("peer1", cro1);
		obj2 = await newTopologyObject("peer2", cro2);
		obj3 = await newTopologyObject("peer3", cro3);
	});

	test("Test: Add Two Vertices", () => {
		/*
      V1:NOP <- V2:ADD(1) <- V2:REMOVE(1)
    */
		// callFn(obj1, "add", ["1"]);
		//cro1.add(1);
		cro1 = obj1.cro as AddWinsSet<number>;
		cro1.add(1);

		console.log(obj1);
	});
});
