import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

// https://vitejs.dev/config/
// PORT/HOST optional per Umgebungsvariable (Standard bleibt 5173 für `tauri dev`)
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: Number(process.env.PORT) || 5173,
    host: process.env.HOST || undefined,
    allowedHosts: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
