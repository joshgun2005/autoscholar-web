import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    hmr: {
      // Prevent RSV1/WebSocket frame errors from crashing the dev server.
      // These occur when a browser extension or proxy sends compressed WS frames.
      // Using a dedicated port isolates HMR from the main server's proxy.
      protocol: 'ws',
    },
    fs: {
      strict: false,
      allow: [
        path.resolve(import.meta.dirname),
        path.resolve(import.meta.dirname, "node_modules"),
        path.resolve(import.meta.dirname, ".."),
      ],
    },
  },
});
