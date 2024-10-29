import * as dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

const envVarsSchema = Joi.object({
	ADDRESSES: Joi.string().optional(),
	BOOTSTRAP: Joi.boolean().default(false),
	BOOTSTRAP_PEERS: Joi.string().optional(),
	BROWSER_METRICS: Joi.boolean().default(false),
	PRIVATE_KEY_SEED: Joi.string().optional(),
});

const { value: envVars, error } = envVarsSchema.validate(process.env, {
	allowUnknown: true,
});

if (error) {
	throw new Error(`Config validation error: ${error.message}`);
}

export const env = {
	addresses: envVars.ADDRESSES ? envVars.ADDRESSES.split(",") : undefined,
	bootstrap: envVars.BOOTSTRAP,
	bootstrap_peers: envVars.BOOTSTRAP_PEERS
		? envVars.BOOTSTRAP_PEERS.split(",")
		: undefined,
	browser_metrics: envVars.BROWSER_METRICS,
	private_key_seed: envVars.PRIVATE_KEY_SEED,
};

export default env;
