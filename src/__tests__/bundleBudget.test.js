/**
 * @file bundleBudget.test.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Drives every failure path of the bundle-size budget, and checks
 *   the budget is wired into the one status check that can block a merge.
 *
 *   The budget exists because the 📦 Bundle Size job measured 165 KB gzipped and
 *   asserted nothing. Writing an assertion is only half of that fix: an
 *   assertion nobody has seen fail is indistinguishable from the `warn`-level
 *   Lighthouse gate it replaces. So each way this can fail is exercised here
 *   rather than checked once by hand.
 *
 *   The last two tests guard the wiring instead of the logic, which is the
 *   failure this repo keeps rediscovering. pr-checks.yml is *not* a required
 *   check — main's ruleset names only "✅ CI" and "Workers Builds" — so a budget
 *   asserted there would go red on the PR page and still merge, exactly as
 *   documented in e2e/contrast.spec.js for the Lighthouse job. The budget
 *   therefore has to run inside a job the aggregate gate depends on, and that is
 *   a property of a file in the repo, so it is testable.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import {
  BUDGETS,
  INITIAL_BUDGET_KB,
  KB,
  evaluate,
  stableName,
  summary,
} from '../../scripts/bundle-size.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = p => readFileSync(resolve(repoRoot, p), 'utf8');

/** An asset record shaped like `measure()` returns, sized in KB for legibility. */
const asset = (name, kb, { initial = true } = {}) => ({
  file: name.replace(/\.(js|css)$/, '-Ab3_dEf9.$1'),
  name,
  raw: kb * KB * 3,
  gzip: Math.round(kb * KB),
  brotli: Math.round(kb * KB * 0.87),
  initial,
});

/** A set that passes: one asset per budget key, each comfortably under. */
const passing = () =>
  Object.entries(BUDGETS).map(([name, kb]) =>
    asset(name, kb * 0.5, { initial: !/Privacy|Terms|NotFound/.test(name) })
  );

describe('stableName', () => {
  it('strips a content hash that itself contains a dash', () => {
    // The case a naive `split('-')` gets wrong, and it is a real filename from
    // this build: the hash `D-OTDVJ1` would leave the key as `react-vendor-D`.
    expect(stableName('react-vendor-D-OTDVJ1.js')).toBe('react-vendor.js');
  });

  it('handles plain names and css', () => {
    expect(stableName('index-D6yYpK7b.js')).toBe('index.js');
    expect(stableName('index-5w2e7oVP.css')).toBe('index.css');
  });

  it('throws on a name it cannot parse rather than guessing', () => {
    // Falling back to the raw filename would mean it never matches a budget key,
    // and the unbudgeted-asset error would then blame a bundler change on the
    // author of whatever chunk happened to appear.
    expect(() => stableName('vendor.js')).toThrow(/content hash/);
  });
});

describe('budget evaluation', () => {
  it('passes when every asset is under budget', () => {
    expect(evaluate({ assets: passing() }).failures).toEqual([]);
  });

  it('fails an asset over its own budget', () => {
    const assets = passing();
    const motion = assets.find(a => a.name === 'motion.js');
    motion.gzip = (BUDGETS['motion.js'] + 3) * KB;

    const { failures } = evaluate({ assets });
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/motion\.js is 50\.0 KB gzipped, over its 47 KB budget/);
  });

  it('passes at exactly the budget, and fails one byte over', () => {
    const at = passing();
    at.find(a => a.name === 'lucide.js').gzip = BUDGETS['lucide.js'] * KB;
    expect(evaluate({ assets: at }).failures).toEqual([]);

    const over = passing();
    over.find(a => a.name === 'lucide.js').gzip = BUDGETS['lucide.js'] * KB + 1;
    expect(evaluate({ assets: over }).failures).toHaveLength(1);
  });

  it('fails an emitted asset that has no budget', () => {
    // The important one. Ignoring unknown files is how a budget stops applying
    // the moment manualChunks splits differently — silently, and green.
    const { failures } = evaluate({ assets: [...passing(), asset('vendor.js', 40)] });
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/vendor\.js \(40\.0 KB gz\) has no budget/);
  });

  it('fails a budget key that matches no emitted asset', () => {
    // The same dead assertion pointing the other way: a renamed chunk leaves a
    // key behind that enforces nothing.
    const { failures } = evaluate({
      assets: passing(),
      budgets: { ...BUDGETS, 'ghost.js': 9 },
    });
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/entry for "ghost\.js" but the build emitted no such asset/);
  });

  it('fails on the initial-load total even when every asset is individually fine', () => {
    // The masking case the per-asset checks cannot see: nothing is over its own
    // ceiling, but together they are over the total.
    const assets = Object.entries(BUDGETS).map(([name, kb]) =>
      asset(name, kb * 0.99, { initial: !/Privacy|Terms|NotFound/.test(name) })
    );
    const { failures } = evaluate({ assets });

    expect(failures.some(f => /Initial load is .* over the 170 KB budget/.test(f))).toBe(true);
    expect(failures.some(f => /over its \d+ KB budget/.test(f))).toBe(false);
  });

  it('excludes lazy chunks from the initial-load total', () => {
    const { initialGzip, lazyGzip } = evaluate({
      assets: [asset('index.js', 10), asset('NotFound.js', 2, { initial: false })],
      budgets: { 'index.js': 34, 'NotFound.js': 3 },
    });
    expect(initialGzip).toBe(10 * KB);
    expect(lazyGzip).toBe(2 * KB);
  });

  it('fails rather than passing at 0 KB when nothing is initial', () => {
    // If index.html stops naming the assets, the initial total is 0 — which is
    // under any budget. Passing there would be the gate reporting success
    // precisely because it had lost the ability to measure.
    const { failures } = evaluate({
      assets: [asset('index.js', 10, { initial: false })],
      budgets: { 'index.js': 34 },
    });
    expect(failures.some(f => /No asset in dist\/assets is referenced/.test(f))).toBe(true);
  });

  it('fails on an empty asset list instead of reporting a clean bundle', () => {
    // A build that emitted nothing, or a glob that stopped matching, must not
    // read as "everything is within budget".
    expect(evaluate({ assets: [] }).failures).toHaveLength(1);
    expect(evaluate({ assets: [] }).failures[0]).toMatch(/no \.js or \.css files/);
  });

  it('reports every failure at once, not just the first', () => {
    const assets = passing();
    assets.find(a => a.name === 'motion.js').gzip = 99 * KB;
    assets.find(a => a.name === 'lucide.js').gzip = 99 * KB;
    expect(evaluate({ assets }).failures.length).toBeGreaterThanOrEqual(2);
  });
});

describe('job summary', () => {
  const render = assets => {
    const { failures, initialGzip, lazyGzip } = evaluate({ assets });
    return summary({
      assets,
      initialGzip,
      lazyGzip,
      failures,
      initialBudgetKb: INITIAL_BUDGET_KB,
    });
  };

  it('shows each asset with its budget and how much of it is used', () => {
    const md = render(passing());
    expect(md).toContain('| `motion.js` | initial |');
    // The percentage is the column that makes the table worth reading — raw KB
    // alone does not say whether 43 KB is fine.
    expect(md).toMatch(/\| `motion\.js` \|.*\| 47 KB \| 50% \|/);
    expect(md).toContain('| `NotFound.js` | lazy |');
  });

  it('separates the initial-load total from the lazy routes', () => {
    const md = render(passing());
    expect(md).toMatch(/\*\*Initial load:\*\* .* of a 170 KB budget/);
    expect(md).toMatch(/\*\*Lazy routes:\*\* .* not on the critical path/);
  });

  it('says it is clean only when it is', () => {
    expect(render(passing())).toContain('Every asset is within budget');
  });

  it('names what went over, so the summary is readable without the log', () => {
    const assets = passing();
    assets.find(a => a.name === 'motion.js').gzip = 99 * KB;

    const md = render(assets);
    expect(md).toContain('[!CAUTION]');
    expect(md).toContain('motion.js is 99.0 KB gzipped');
    expect(md).not.toContain('Every asset is within budget');
  });

  it('renders an unbudgeted asset without inventing a budget for it', () => {
    const md = render([...passing(), asset('vendor.js', 40)]);
    expect(md).toMatch(/\| `vendor\.js` \|.*\| — \| — \|/);
  });
});

describe('budget wiring', () => {
  it('is exposed as an npm script so it is runnable outside CI', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts.size).toMatch(/scripts\/bundle-size\.js/);
  });

  it('runs inside a job the required "✅ CI" gate depends on', () => {
    // pr-checks.yml cannot enforce this: it is not a required check and has no
    // merge_group trigger, so a red budget there does not stop a merge. The
    // budget only bites if it runs in a job listed in the aggregate gate's
    // `needs`, which is what this asserts.
    const ci = parse(read('.github/workflows/ci.yml'));
    const gated = new Set(ci.jobs.ci.needs);

    const runners = Object.entries(ci.jobs)
      .filter(([, job]) => (job.steps ?? []).some(s => /npm run size\b/.test(s.run ?? '')))
      .map(([id]) => id);

    expect(runners.length, 'no job in ci.yml runs `npm run size`').toBeGreaterThan(0);
    expect(runners.some(id => gated.has(id))).toBe(true);
  });

  it('keeps the total below the sum of the per-asset initial budgets', () => {
    // Otherwise the total is unreachable and only the per-asset checks ever
    // fire, which is the masking case above left permanently unguarded.
    const lazy = new Set(['PrivacyPolicy.js', 'TermsConditions.js', 'NotFound.js']);
    const sumInitial = Object.entries(BUDGETS)
      .filter(([name]) => !lazy.has(name))
      .reduce((n, [, kb]) => n + kb, 0);

    expect(INITIAL_BUDGET_KB).toBeLessThan(sumInitial);
  });
});
