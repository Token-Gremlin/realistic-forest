import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 4096,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
