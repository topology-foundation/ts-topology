import Benchmark from "benchmark";
import { AddWinsSet } from "../../blueprints/src/AddWinsSet/index.js";
import { TopologyObject } from "../src/index.js";

function benchmarkForAddWinSet(
	name: string,
	numCROs: number,
	verticesPerCRO: number,
	mergeFn: boolean,
) {
	return suite.add(name, () => {
		const objects: TopologyObject[] = [];
		for (let i = 0; i < numCROs; i++) {
			const obj: TopologyObject = new TopologyObject(
				`peer${i + 1}`,
				new AddWinsSet<number>(),
			);
			const cro = obj.cro as AddWinsSet<number>;
			for (let j = 0; j < verticesPerCRO; j++) {
				if (i % 3 === 2) {
					cro.add(j);
					cro.remove(j);
				} else if (i % 3 === 1) {
					cro.remove(j);
					cro.add(j);
				} else {
					cro.add(j);
				}
			}
			objects.push(obj);
		}

		if (mergeFn) {
			for (let i = 0; i < objects.length; i++) {
				for (let j = 0; j < objects.length; j++) {
					if (i !== j) {
						objects[i].merge(objects[j].hashGraph.getAllVertices());
					}
				}
			}
		}
	});
}

const suite = new Benchmark.Suite();

benchmarkForAddWinSet("Create HashGraph with 1000 vertices", 1, 1000, false);

benchmarkForAddWinSet(
	"Create 2 CROs (1000 vertices each) and Merge",
	2,
	1000,
	true,
);

suite
	.on("cycle", (event) => {
		console.log(String(event.target));
	})
	.on("complete", function () {
		console.log(`Fastest is ${this.filter("fastest").map("name")}`);
	})
	.run({ async: true });
