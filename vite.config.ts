import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5188,
    strictPort: true,
    // Captures and vendored asset/tool caches do not need hot reload.
    watch: {ignored:['**/work/**','**/artifacts/**']},
  },
  preview: {
    host: '127.0.0.1',
    port: 4188,
    strictPort: true,
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      output: {
        // Keep the large WASM wrapper cached when only game code changes.
        codeSplitting: {
          groups: [{ name: 'rapier', test: /node_modules[\\/]@dimforge[\\/]rapier3d-compat[\\/]/ }],
        },
      },
    },
  },
});
