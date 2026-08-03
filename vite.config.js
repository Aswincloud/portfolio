import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import securityHeaders from './scripts/vite-plugin-security-headers.js';
import prerenderHero from './scripts/vite-plugin-prerender-hero.js';
import sitemap from './scripts/vite-plugin-sitemap.js';
import routePages from './scripts/vite-plugin-route-pages.js';

export default defineConfig({
  // Order matters for two of these. prerenderHero writes the hero copy into the
  // shell (transformIndexHtml). routePages then derives the per-route documents
  // from the *written* dist/index.html in closeBundle, so it has to run after
  // Vite emits it and before securityHeaders — which is `enforce: 'post'` and
  // hashes the final index.html, so it must stay last. sitemap only emits its
  // own file and reads nothing the others write, so its position is free.
  plugins: [react(), prerenderHero(), sitemap(), routePages(), securityHeaders()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 'hidden' still writes .map files (so they can be uploaded to an error
    // tracker) but omits the //# sourceMappingURL comment, so browsers don't
    // fetch them. Paired with .assetsignore, which keeps them out of the deploy
    // entirely — previously the full annotated sources were public.
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        // Split rarely-changing vendor code into its own chunk. Vendor deps
        // change far less often than app code, so an isolated chunk stays in
        // the browser cache across deploys — visitors only re-download the
        // (small) app chunk when we ship changes.
        //
        // A function (not the object form) is used deliberately: the object
        // form only matched the named entry points, so transitive deps such as
        // react-dom's `scheduler` leaked into the main chunk (~95 KB gz).
        // Matching on the node_modules path captures the whole subtree.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // React core + anything that must share React's module instance:
          // react-dom pulls in scheduler; router and intersection-observer
          // import react. Bundling them together avoids duplicate React copies.
          if (
            /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|react-intersection-observer|@remix-run[\\/]router)[\\/]/.test(
              id
            )
          ) {
            return 'react-vendor';
          }
          // motion re-exports from motion-dom / motion-utils; keep the whole
          // animation runtime in one chunk rather than the catch-all vendor.
          if (/[\\/]node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/.test(id))
            return 'motion';
          if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return 'lucide';
          // Everything else third-party → one cacheable vendor chunk.
          return 'vendor';
        },
      },
    },
  },
  define: {
    'process.env': {},
  },
});
