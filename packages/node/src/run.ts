import { env } from "./config.js";
import { TopologyNode, type TopologyNodeConfig } from "./index.js";
import { init as rpc_init } from "./rpc/index.js";

const run = async () => {
	const config: TopologyNodeConfig | undefined = env as TopologyNodeConfig;
	const node = new TopologyNode(config);
	await node.start();
	rpc_init(node);
};

run();
