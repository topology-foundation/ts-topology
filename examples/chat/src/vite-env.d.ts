interface ImportMetaEnv {
	readonly VITE_TOPOLOGY_MODE: string;
	// more env variables...
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
