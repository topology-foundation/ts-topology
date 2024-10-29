import fs from "node:fs";
import * as dotenv from "dotenv";
import { program } from "./cli/index.js";

program.parse(process.argv);
const opts = program.opts();

const initializeEnv = () => {
	if (opts.config) {
		const configFile = JSON.parse(fs.readFileSync(opts.config, "utf8"));
		return JSON.parse(fs.readFileSync(opts.config, "utf8"));
	}

	const result = dotenv.config();
	if (result.error) {
		throw result.error;
	}
	return {
		network_config: {
			addresses: process.env.ADDRESSES ? process.env.ADDRESSES.split(",") : [],
			bootstrap: process.env.BOOTSTRAP === "true",
			bootstrap_peers: process.env.BOOTSTRAP_PEERS
				? process.env.BOOTSTRAP_PEERS.split(",")
				: [],
			browser_metrics: process.env.BROWSER_METRICS === "true",
			private_key_seed: process.env.PRIVATE_KEY_SEED,
		},
	};
};

export const env = initializeEnv();
