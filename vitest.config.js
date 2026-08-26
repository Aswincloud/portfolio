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

      // `include` is the load-bearing line, and it was missing when thresholds
      // were first added. By default the v8 provider only reports on files the
      // tests actually imported, so a file with no test is not scored 0% — it is
      // absent from the denominator entirely. Measured on the commit that added
      // the thresholds below: 12 source files were invisible to the gate
      // (src/main.jsx, PrivacyPolicy, TermsConditions, NotFound, all four
      // PageTransitions files, src/utils/index.js, and three scripts/ CLIs).
      //
      // So the gate could not detect the regression it most needed to: adding a
      // wholly untested file could not lower the percentage, because untested
      // files did not count. The honest global figure is 65% rather than the
      // 71% previously reported, and that 6-point gap *was* the hole. Naming the
      // sources explicitly means coverage is measured against the code that
      // exists, not against the subset the current tests happen to reach.
      include: ['src/**/*.{js,jsx}', 'scripts/**/*.{js,mjs}', 'worker.js'],

      // Vitest 4 ships an empty default exclude list, so everything skipped has
      // to be named here.
      exclude: [
        // Test files and harness: measuring the tests tells us nothing about
        // whether the code is tested.
        'src/**/__tests__/**',
        'src/**/*.{test,spec}.{js,jsx}',
        'src/setupTests.js',

        // Dev-only, and verified absent from the production bundle: both entry
        // points are behind `import.meta.env.DEV`, and grepping dist/assets/*.js
        // for `ErrorDevTools` finds zero occurrences, so it is fully tree-shaken.
        // 290 lines at 2% would otherwise dominate the src/** figure while
        // describing code no visitor ever downloads.
        'src/components/ErrorBoundary/ErrorDevTools.jsx',
      ],

      // Coverage was computed and reported for a long time without being
      // asserted on: `test:coverage` printed a table, uploaded it as an
      // artifact, and passed at any number. That is the same shape as the two
      // gates already fixed in this repo — the Lighthouse assertions that were
      // `warn` (green at a score of 45) and the accessibility category that
      // passed while 47 contrast violations were on the page. A gate that
      // cannot fail is not a gate, so these are `thresholds`, not a report.
      //
      // Per-scope rather than one global number, because a single figure over
      // this tree is close to meaningless: build-time tooling in scripts/ sits
      // around 30% and application code in src/ around 77%, so the global
      // average moves when the *ratio* of tooling to app code changes and not
      // because anything got better or worse. Globs are additive here, not
      // partitions — vitest checks each glob and then checks the global over
      // every file regardless of which globs matched (see resolveThresholds in
      // vitest/dist/chunks/coverage.*.js) — so the global below stays a backstop
      // and each scope carries a floor appropriate to its own risk.
      //
      // Every number is the measured value rounded down by roughly two points.
      // Unlike the Lighthouse categories, which sit at exactly 1.0 with zero
      // spread and are therefore pinned exactly, coverage moves a fraction of a
      // point whenever anyone touches a large file — so pinning it at the
      // measured value would fail on ordinary commits and train people to
      // re-run rather than to look. Two points absorbs that churn while still
      // catching the regressions worth catching: a deleted test file, or a
      // sizeable uncovered addition.
      //
      // These are ratchets, not targets. Raise them when the real number rises;
      // do not lower one to make a red build green.
      thresholds: {
        // Application code. The floor that matters most — it is what visitors
        // run. Branches lag statements here because the defensive paths in the
        // error boundary and the contact form's failure handling are the least
        // exercised part of the tree.
        'src/**': { statements: 75, branches: 64, functions: 74, lines: 76 },

        // Build tooling. Low, and deliberately kept in the report rather than
        // excluded: the vite plugins here shape what ships (prerender, security
        // headers, sitemap) and they are the tested half. The untested half is
        // three CLIs — copyright-check, security-check, serve-with-headers — at
        // a flat 0%, which is what holds this scope down. A floor stops that
        // getting worse while the plugins keep it honest.
        'scripts/**': { statements: 33, branches: 30, functions: 42, lines: 32 },

        // The Cloudflare Worker: contact-form validation and rate limiting. The
        // highest floor of the three because it is a single file of pure request
        // handling with no UI to render, and it is the one place where a gap is
        // a live endpoint accepting something it should reject.
        'worker.js': { statements: 84, branches: 87, functions: 84, lines: 84 },

        // Backstop over every included file, so a new top-level directory that
        // matches no glob above still has to clear a bar.
        //
        // These are lower than the numbers they replace (69/64/69/70) and that
        // is not a relaxation. Those were measured against a denominator that
        // omitted every untested file; these are measured against all of them.
        // Same code, more of it counted, so the percentage falls while the gate
        // gets strictly stronger — it can now fail for a wholly untested
        // addition, which is the case it previously could not see at all.
        statements: 62,
        branches: 58,
        functions: 66,
        lines: 63,
      },
    },
  },
});
