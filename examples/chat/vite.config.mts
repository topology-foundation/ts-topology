import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";

export default defineConfig({
  build: {
    target: "esnext",
  },
  plugins: [
    nodePolyfills({
      overrides: {
        fs: "memfs",
      },
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
  resolve: {
    alias: {
      "@topology-foundation": path.resolve(__dirname, "../../packages"),
    },
  },
});
