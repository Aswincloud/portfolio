import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Split rarely-changing vendor code into its own chunk. Vendor deps
        // change far less often than app code, so an isolated chunk stays in
        // the browser cache across deploys — visitors only re-download the
        // (small) app chunk when we ship changes.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  define: {
    'process.env': {},
  },
});
