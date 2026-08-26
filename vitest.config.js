import { defineConfig } from 'vitest/config';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Extend Vitest's defaults so we don't accidentally re-include dirs it
    // intentionally skips; just add the Playwright e2e/ dir.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.config.js', '**/*.config.ts', 'src/setupTests.js'],

      // Coverage was computed and reported for a long time without being
      // asserted on: `test:coverage` printed a table, uploaded it as an
      // artifact, and passed at any number. That is the same shape as the two
      // gates already fixed in this repo — the Lighthouse assertions that were
      // `warn` (green at a score of 45) and the accessibility category that
      // passed while 47 contrast violations were on the page. A gate that
      // cannot fail is not a gate, so these are `thresholds`, not a report.
      //
      // The numbers are a floor derived from what is actually covered today
      // (71.34 / 66.66 / 71.60 / 72.48), rounded down by roughly two points.
      // Unlike the Lighthouse categories, which sit at exactly 1.0 with zero
      // spread and are therefore pinned exactly, coverage moves a fraction of a
      // point whenever anyone touches a large file — so pinning it at the
      // measured value would fail on ordinary commits and train people to
      // re-run rather than to look. Two points absorbs that churn while still
      // catching the regressions worth catching: a deleted test file, or a
      // sizeable uncovered addition.
      //
      // This is a ratchet, not a target. It is low partly because build-time
      // tooling in scripts/ is counted (generate-og-image.mjs sits at 27%,
      // sitemap at 35%) and drags the global figure well below the ~85% the
      // application code under src/components/sections holds. Raise it when the
      // real number rises; do not lower it to make a red build green.
      thresholds: {
        statements: 69,
        branches: 64,
        functions: 69,
        lines: 70,
      },
    },
  },
});
