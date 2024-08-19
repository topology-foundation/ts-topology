import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

export default defineConfig({
  build: {
    target: 'esnext',
  },
  plugins: [
    nodePolyfills({
      overrides: {
        fs: 'memfs',
      },
    }),
  ],
  resolve: {
    alias: {
      "@topology-foundation/crdt": path.join(__dirname, "../../", "node_modules/@topology-foundation/crdt")
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  },
})
