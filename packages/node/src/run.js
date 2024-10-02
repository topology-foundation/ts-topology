import fs from "node:fs";
import { program } from "./cli/index.js";
import { TopologyNode } from "./index.js";
async function startNode(config) {
    const node = new TopologyNode(config);
    node.start();
}
const run = () => {
    program.parse(process.argv);
    const opts = program.opts();
    let config;
    if (opts.config) {
        config = JSON.parse(fs.readFileSync(opts.config, "utf8"));
    }
    startNode(config);
};
run();
