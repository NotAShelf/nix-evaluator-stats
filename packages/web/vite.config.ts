import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    alias: {
      'lucide-solid/icons': fileURLToPath(
        new URL('./node_modules/lucide-solid/dist/source/icons', import.meta.url),
      ),
    },
  },
  base: process.env.GITHUB_PAGES ? '/nix-evaluator-stats/' : './',
  server: {
    port: 3000,
    open: false,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
});
