import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - separate libraries that rarely change
          'react-vendor': ['react', 'react-dom', 'wouter'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-popover',
          ],
          'trpc-vendor': ['@trpc/client', '@trpc/react-query', '@tanstack/react-query'],
          'chart-vendor': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increase slightly from default 500KB
    minify: 'esbuild', // Use esbuild for faster minification (no extra dependencies needed)
  },
  server: {
    host: true,
    strictPort: false,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
