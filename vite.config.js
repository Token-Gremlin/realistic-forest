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
    // quick tunnels (trycloudflare, etc.) send a public Host header
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
});
