import { beforeEach, describe, expect, test } from "vitest";
import { AddWinsSet } from "../../crdt/src/cros/AddWinsSet/index.js";
import {
	type TopologyObject,
	callFn,
	newTopologyObject,
} from "../src/index.js";

describe("HashGraph for AddWinSet tests", () => {
	let obj1: TopologyObject<number>;
	let obj2: TopologyObject<number>;
	let obj3: TopologyObject<number>;

	beforeEach(async () => {
		obj1 = await newTopologyObject("peer1", new AddWinsSet<number>());
		obj2 = await newTopologyObject("peer2", new AddWinsSet<number>());
		obj3 = await newTopologyObject("peer3", new AddWinsSet<number>());
	});

	test("Test: Add Two Vertices", () => {
		/*
      V1:NOP <- V2:ADD(1) <- V2:REMOVE(1)
    */
		const cro1 = obj1.cro as AddWinsSet<number>;
		cro1.add(1);
		console.log(obj1);
	});
});
