import { program } from "./cli/index.js";
import { loadConfig } from "./config.js";
import { TopologyNode } from "./index.js";
import type { TopologyNodeConfig } from "./index.js";
import { init as rpc_init } from "./rpc/index.js";

const run = async () => {
	program.parse(process.argv);
	const opts = program.opts();
	const config: TopologyNodeConfig | undefined = loadConfig(opts.config);

	const node = new TopologyNode(config);
	await node.start();
	rpc_init(node);
};

run();
