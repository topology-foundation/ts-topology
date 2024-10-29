import fs from "node:fs";
import { program } from "./cli/index.js";
import { env } from "./config.js";
import { TopologyNode, type TopologyNodeConfig } from "./index.js";
import { init as rpc_init } from "./rpc/index.js";

const run = async () => {
	program.parse(process.argv);
	const opts = program.opts();
	let config: TopologyNodeConfig | undefined;
	if (opts.config) {
		config = JSON.parse(fs.readFileSync(opts.config, "utf8"));
	} else {
		config = env as TopologyNodeConfig;
	}

	const node = new TopologyNode(config);
	await node.start();
	rpc_init(node);
};

run();
