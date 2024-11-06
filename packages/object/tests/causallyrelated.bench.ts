import { bench, describe } from "vitest";
import { AddWinsSet } from "../../blueprints/src/AddWinsSet/index.js";
import { type Hash, TopologyObject } from "../src/index.js";

describe("AreCausallyDependent benchmark", async () => {
	const samples = 100000;
	const tests: Hash[][] = [];

	const obj1 = new TopologyObject("peer1", new AddWinsSet<number>());
	const obj2 = new TopologyObject("peer2", new AddWinsSet<number>());
	const obj3 = new TopologyObject("peer3", new AddWinsSet<number>());

	const cro1 = obj1.cro as AddWinsSet<number>;
	const cro2 = obj2.cro as AddWinsSet<number>;
	const cro3 = obj3.cro as AddWinsSet<number>;

	cro1.add(1);
	obj2.merge(obj1.hashGraph.getAllVertices());

	cro1.add(1);
	cro1.remove(2);
	cro2.remove(2);
	cro2.add(2);

	obj3.merge(obj1.hashGraph.getAllVertices());
	cro3.add(3);
	cro1.remove(1);

	obj1.merge(obj2.hashGraph.getAllVertices());
	cro1.remove(3);
	cro2.remove(1);

	obj1.merge(obj2.hashGraph.getAllVertices());
	obj1.merge(obj3.hashGraph.getAllVertices());

	const vertices = obj1.hashGraph.getAllVertices();
	for (let i = 0; i < samples; i++) {
		tests.push([
			vertices[Math.floor(Math.random() * vertices.length)].hash,
			vertices[Math.floor(Math.random() * vertices.length)].hash,
		]);
	}

	bench("Causality check using BFS", async () => {
		for (let i = 0; i < samples; i++) {
			const result = obj1.hashGraph.areCausallyRelatedUsingBFS(
				tests[i][0],
				tests[i][1],
			);
		}
	});

	bench("Causality check using Bitsets", async () => {
		for (let i = 0; i < samples; i++) {
			const result = obj1.hashGraph.areCausallyRelatedUsingBitsets(
				tests[i][0],
				tests[i][1],
			);
		}
	});
});
