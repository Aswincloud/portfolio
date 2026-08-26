#!/usr/bin/env node
/**
 * @file bundle-size.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Measures the built bundle and fails when an asset exceeds its
 *   budget. Replaces a CI step that measured the same bytes and asserted
 *   nothing.
 *
 *   The 📦 Bundle Size job printed a gzipped table to the step summary and
 *   always passed. That is the fourth instance of one failure mode in this
 *   repo: Lighthouse assertions left at `warn` (green at a score of 45), the
 *   accessibility category passing while 47 contrast violations were live,
 *   `upload-artifact` uploading nothing because `if-no-files-found` defaults to
 *   `warn`, and coverage computed with no thresholds. Measuring is not gating.
 *
 *   Three design points decide whether this can actually catch anything:
 *
 *   1. **Unbudgeted assets are an error.** A budget map that silently ignores
 *      files it does not recognise stops applying the moment a chunk is renamed
 *      or `manualChunks` splits differently, and reports success while doing it.
 *      So every emitted asset must have an entry, and every entry must match an
 *      emitted asset — a stale key means a rename already happened and the
 *      budget was quietly dead. Both directions fail loudly.
 *
 *   2. **`initial` is derived from `dist/index.html`, not hardcoded.** What
 *      costs a visitor time is the entry chunk plus its modulepreloads plus the
 *      stylesheet — not the sum of everything in `dist/assets`. The three lazy
 *      route chunks (privacy, terms, 404) are real bytes but they are not on the
 *      home-page critical path, and a total that mixes them in gets steadily
 *      less meaningful as more routes are split out. Reading the HTML means the
 *      split is whatever Vite actually emitted rather than a list here that
 *      drifts.
 *
 *   3. **The evaluation is a pure function, exported and tested.** The failure
 *      paths are the whole product here, and a gate whose failure path has only
 *      ever been checked by hand is not meaningfully verified — see
 *      bundleBudget.test.js, which drives each one. Only the I/O and the
 *      printing live behind the `isMain` guard below.
 *
 *   Budgets are asserted on gzip, which is what the previous table reported and
 *   what is comparable against any other project. Brotli is what Cloudflare
 *   actually serves and is ~12% smaller, so it is shown alongside for the honest
 *   number — but asserting on it would tie the gate to a CDN quality setting we
 *   do not control.
 *
 *   Usage: `npm run size` (add `--json` for machine-readable output).
 */
import { readFileSync, readdirSync, existsSync, appendFileSync } from 'node:fs';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const KB = 1024;

/**
 * Gzipped ceilings in KB, keyed by the stable chunk name — the `[name]` half of
 * Vite's `[name]-[hash]` output, which for the vendor chunks is the string
 * `manualChunks` in vite.config.js returns.
 *
 * Headroom is deliberately uneven, because these chunks move for different
 * reasons. `index` and `index.css` are app code and move on any feature commit,
 * so they get the most room. The vendor chunks only move when a dependency
 * moves, and this repo takes grouped Dependabot bumps weekly — a few percent is
 * ordinary there, a 10% jump is a dependency that grew and is worth reading the
 * changelog for. `lucide` is sized for icons being added one at a time
 * (~0.1–0.3 KB each) rather than for a version bump.
 *
 * `vendor` is deliberately absent. vite.config.js's `manualChunks` falls back to
 * it for any third-party module outside the react / motion / lucide groups, and
 * today nothing lands there so the chunk is never emitted — adding a budget for
 * it now would be a stale key, and the check below would fail on it. When a new
 * dependency does produce it, the unbudgeted-asset error fires, which is the
 * intended outcome: a new vendor chunk should be a decision, not a surprise.
 *
 * These are ceilings to hold, not targets to fill. When a bump legitimately
 * needs more room, raise the one number and say why in the commit — that edit
 * is the review moment this file exists to create. Do not raise it to make a red
 * build green without reading what grew.
 */
export const BUDGETS = {
  'index.js': 34, // app code, measured 29.1
  'index.css': 14, // Tailwind output, measured 11.7
  'react-vendor.js': 75, // react + react-dom + router, measured 68.3
  'motion.js': 47, // motion runtime, measured 42.8
  'lucide.js': 10, // tree-shaken icons, measured 7.1
  'rolldown-runtime.js': 2, // module loader shim, measured 0.4
  'PrivacyPolicy.js': 5, // lazy route, measured 2.8
  'TermsConditions.js': 5, // lazy route, measured 2.7
  'NotFound.js': 3, // lazy route, measured 1.1
};

/**
 * Ceiling on the sum of the initial-load assets, in gzipped KB.
 *
 * Held deliberately below the sum of the individual initial budgets (182 KB), so
 * that every chunk creeping toward its own ceiling at once still fails. Measured
 * 159.3 KB, so this leaves ~11 KB — enough for ordinary app-code growth, tight
 * enough that adding a library of any real size has to be a decision.
 */
export const INITIAL_BUDGET_KB = 170;

/** Content hashes are 8 chars of `[A-Za-z0-9_-]`; note they can contain `-`. */
const HASHED = /^(.+)-[A-Za-z0-9_-]{8}\.(js|css)$/;

/**
 * Strip the content hash to get the stable budget key, e.g.
 * `react-vendor-D-OTDVJ1.js` → `react-vendor.js`.
 *
 * Throws rather than falling back to the raw filename: an unparsed name would
 * never match a budget key, and the "unbudgeted asset" error below would then
 * blame the wrong thing. If a bundler upgrade changes the hash format, the
 * message should say so.
 */
export const stableName = file => {
  const m = HASHED.exec(file);
  if (!m) {
    throw new Error(
      `Cannot parse a content hash out of "${file}". Vite's [name]-[hash] ` +
        `format may have changed; update HASHED in scripts/bundle-size.js.`
    );
  }
  return `${m[1]}.${m[2]}`;
};

export const fmt = bytes => (bytes / KB).toFixed(1);

/**
 * Read dist/ and return one record per emitted JS/CSS asset.
 *
 * `initial` is decided by whether the hashed filename appears anywhere in
 * index.html, which covers the entry `<script>`, the `modulepreload` links and
 * the stylesheet without depending on how those tags are ordered or attributed.
 */
export const measure = distDir => {
  const assetsDir = join(distDir, 'assets');
  if (!existsSync(assetsDir)) throw new Error(`No ${assetsDir}. Run \`npm run build\` first.`);

  const html = readFileSync(join(distDir, 'index.html'), 'utf8');

  return readdirSync(assetsDir)
    .filter(f => /\.(js|css)$/.test(f))
    .map(file => {
      const buf = readFileSync(join(assetsDir, file));
      return {
        file,
        name: stableName(file),
        raw: buf.length,
        gzip: gzipSync(buf).length,
        brotli: brotliCompressSync(buf).length,
        initial: html.includes(file),
      };
    })
    .sort((a, b) => b.gzip - a.gzip);
};

/**
 * Compare measured assets against the budgets. Pure — no I/O, no exit — so the
 * failure paths can be driven directly from tests.
 *
 * Annotates each asset with its `budget` and returns every failure rather than
 * the first, so one run tells you everything that needs attention.
 */
export const evaluate = ({
  assets,
  budgets = BUDGETS,
  initialBudgetKb = INITIAL_BUDGET_KB,
} = {}) => {
  const failures = [];

  if (!assets || assets.length === 0) {
    return {
      failures: ['dist/assets contains no .js or .css files, so no budget was enforced.'],
      initialGzip: 0,
      lazyGzip: 0,
    };
  }

  for (const a of assets) {
    const budget = budgets[a.name];
    if (budget === undefined) {
      // Not a warning. An asset with no budget is an asset the gate does not
      // cover, which is exactly the state this script was written to end.
      failures.push(
        `${a.name} (${fmt(a.gzip)} KB gz) has no budget. Add it to BUDGETS in ` +
          `scripts/bundle-size.js — a new chunk that nothing measures is how ` +
          `bundle size regressions get in.`
      );
      continue;
    }
    a.budget = budget;
    if (a.gzip > budget * KB) {
      failures.push(
        `${a.name} is ${fmt(a.gzip)} KB gzipped, over its ${budget} KB budget ` +
          `by ${fmt(a.gzip - budget * KB)} KB.`
      );
    }
  }

  // A key that matches nothing means the chunk was renamed or dropped and this
  // budget silently stopped applying — the same class of dead assertion as the
  // checks above, just pointing the other way.
  const emitted = new Set(assets.map(a => a.name));
  for (const key of Object.keys(budgets)) {
    if (!emitted.has(key)) {
      failures.push(
        `BUDGETS has an entry for "${key}" but the build emitted no such asset. ` +
          `If it was renamed or removed, update scripts/bundle-size.js — until ` +
          `then that budget is enforcing nothing.`
      );
    }
  }

  const initial = assets.filter(a => a.initial);
  const initialGzip = initial.reduce((n, a) => n + a.gzip, 0);
  const lazyGzip = assets.filter(a => !a.initial).reduce((n, a) => n + a.gzip, 0);

  if (initial.length === 0) {
    // The entry script is always referenced from index.html, so an empty initial
    // set means the HTML was not parsed as expected — not that the page ships no
    // JavaScript. Left as a failure so the budget can never pass at 0 KB.
    failures.push(
      `No asset in dist/assets is referenced by dist/index.html. The initial-load ` +
        `budget cannot be evaluated, so it is not being enforced.`
    );
  } else if (initialGzip > initialBudgetKb * KB) {
    failures.push(
      `Initial load is ${fmt(initialGzip)} KB gzipped, over the ` +
        `${initialBudgetKb} KB budget by ${fmt(initialGzip - initialBudgetKb * KB)} KB.`
    );
  }

  return { failures, initialGzip, lazyGzip };
};

/** Markdown for GitHub's job summary — same table the inline bash step printed. */
export const summary = ({ assets, initialGzip, lazyGzip, failures, initialBudgetKb }) => {
  const used = (n, budgetKb) => (budgetKb ? `${Math.round((n / (budgetKb * KB)) * 100)}%` : '—');
  return (
    [
      '### 📦 Bundle size (gzipped)',
      '',
      '| Asset | Load | Raw | Gzip | Brotli | Budget | Used |',
      '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
      ...assets.map(
        a =>
          `| \`${a.name}\` | ${a.initial ? 'initial' : 'lazy'} | ${fmt(a.raw)} KB | ` +
          `${fmt(a.gzip)} KB | ${fmt(a.brotli)} KB | ${a.budget ? `${a.budget} KB` : '—'} | ` +
          `${used(a.gzip, a.budget)} |`
      ),
      '',
      `**Initial load:** ${fmt(initialGzip)} KB gzipped of a ${initialBudgetKb} KB budget ` +
        `(${used(initialGzip, initialBudgetKb)} used)`,
      '',
      `**Lazy routes:** ${fmt(lazyGzip)} KB gzipped, not on the critical path.`,
      '',
      failures.length
        ? `> [!CAUTION]\n> Over budget:\n${failures.map(f => `> - ${f}`).join('\n')}`
        : '> [!NOTE]\n> Every asset is within budget.',
      '',
    ].join('\n') + '\n'
  );
};

// ── CLI ─────────────────────────────────────────────────────────────────────
// Guarded so importing this module for tests neither reads dist/ nor exits.
const isMain =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  let assets;
  try {
    assets = measure(join(root, 'dist'));
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }

  const { failures, initialGzip, lazyGzip } = evaluate({ assets });

  if (process.argv.includes('--json')) {
    console.log(
      JSON.stringify(
        { assets, initialGzip, lazyGzip, initialBudgetKb: INITIAL_BUDGET_KB, failures },
        null,
        2
      )
    );
  } else {
    console.log('\n📦 Bundle size\n');
    console.table(
      assets.map(a => ({
        Asset: a.name,
        Load: a.initial ? 'initial' : 'lazy',
        Raw: `${fmt(a.raw)} KB`,
        Gzip: `${fmt(a.gzip)} KB`,
        Brotli: `${fmt(a.brotli)} KB`,
        Budget: a.budget ? `${a.budget} KB` : '—',
        Used: a.budget ? `${Math.round((a.gzip / (a.budget * KB)) * 100)}%` : '—',
      }))
    );
    const pct = Math.round((initialGzip / (INITIAL_BUDGET_KB * KB)) * 100);
    console.log(
      `   initial ${fmt(initialGzip)} KB gz / ${INITIAL_BUDGET_KB} KB budget (${pct}% used)`
    );
    console.log(
      `   lazy    ${fmt(lazyGzip)} KB gz across ${assets.filter(a => !a.initial).length} chunks\n`
    );
  }

  // GitHub renders this on the job page, which is where the old inline-bash
  // table went. Keeping it means the assertion did not cost the reporting.
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      summary({ assets, initialGzip, lazyGzip, failures, initialBudgetKb: INITIAL_BUDGET_KB })
    );
  }

  if (failures.length) {
    console.error('❌ Bundle size budget exceeded:\n');
    for (const f of failures) console.error(`   • ${f}`);
    console.error('');
    process.exit(1);
  }

  console.log('✅ Every asset is within budget.\n');
}
