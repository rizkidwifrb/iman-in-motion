import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');
          if (!normalizedId.includes('/node_modules/')) return undefined;
          if (normalizedId.includes('/node_modules/firebase/')) return 'vendor-firebase';
          if (normalizedId.includes('/node_modules/lucide-react/')) return 'vendor-icons';
          if (
            normalizedId.includes('/node_modules/react/') ||
            normalizedId.includes('/node_modules/react-dom/') ||
            normalizedId.includes('/node_modules/scheduler/')
          ) return 'vendor-react';
          return 'vendor';
        }
      }
    }
  }
});
