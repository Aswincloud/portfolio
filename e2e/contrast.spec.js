/**
 * @file contrast.spec.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Runs axe-core over every rendered page and fails on any
 *   accessibility violation. Exists because the Lighthouse job could not see the
 *   one class of defect it was supposed to catch.
 *
 *   The CI Lighthouse gate asserts `categories:accessibility: minScore 1`, and it
 *   was passing while 47 real `color-contrast` violations were on the page. Cause:
 *   `@lhci/cli@0.14.x` bundles Lighthouse 12.1.0, whose axe-core is too old to
 *   resolve `oklch()` colours — and Tailwind v4 emits *every* colour as oklch, so
 *   the contrast audit silently evaluated almost nothing and reported a clean
 *   pass. Standalone Lighthouse 12.8.2 scored the same page 0.96 with 7 failing
 *   nodes, and axe-core 4.12.1 directly reported 47.
 *
 *   So this suite pins its own axe-core as a devDependency rather than inheriting
 *   whatever a downstream tool happens to bundle, and it lives in e2e — which runs
 *   inside the required `✅ CI` gate. The Lighthouse job is not a required check,
 *   so even once its axe can see oklch it cannot block a merge on its own.
 *
 *   Two details keep this from passing vacuously, which is the failure mode it was
 *   written in response to:
 *
 *   1. It scrolls the whole page before auditing. Sections reveal via
 *      react-intersection-observer with `triggerOnce`, so they start at opacity 0
 *      — and axe skips invisible elements. Measured on the home page: auditing
 *      without scrolling evaluates 38 contrast nodes, scrolling first evaluates
 *      165. So roughly three quarters of the page's text is invisible to an
 *      unscrolled audit, which is how a contrast problem this size sat behind a
 *      green gate. Coverage still is not total — about 36 elements remain at
 *      opacity 0 even after the sweep, so this raises the floor rather than
 *      proving the whole page clean.
 *   2. It asserts on the *full* violation set, not just contrast. Every violation
 *      found when this was written was `color-contrast` (47 nodes, zero other rule
 *      types), so zero-across-all-rules is the honest current state. The trade-off
 *      is that a future axe-core minor can introduce a rule and fail a dependency
 *      bump — which for an accessibility gate is the behaviour you want, and the
 *      message below names the rule so it is obvious rather than mysterious.
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Block third-party analytics/chat, matching smoke.spec.js and
// contactFailure.spec.js. It matters more here than in those: the Chatwoot
// widget injects its own DOM into the page (measured: 6 elements unblocked
// versus 3 blocked), and axe audits whatever it finds. Without this the gate
// can fail on markup from a service we do not control and cannot fix, and it
// makes an accessibility assertion depend on that service being reachable —
// support.aswincloud.com currently answers 502 for the widget iframe, so its
// contribution to the DOM is not even stable run to run.
test.beforeEach(async ({ page }) => {
  await page.route(/googletagmanager\.com|google-analytics\.com|chatwoot|widget/i, r => r.abort());
});

const AXE = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../node_modules/axe-core/axe.min.js'),
  'utf8'
);

/**
 * Scroll to the bottom in steps so every `triggerOnce` observer fires, then
 * return to the top. Stepped rather than one jump to the end: an observer that
 * never has the section in view does not fire, and a single jump can skip past
 * the middle of the page entirely.
 */
const revealAll = async page => {
  await page.evaluate(async () => {
    const step = Math.floor(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 400));
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 200));
  });
};

// Both widths, because the page swaps components at the `sm`/`md` breakpoints
// rather than restyling them, and font sizes change with them — the hero stat
// labels are 10px on mobile and 11px above `sm`, and contrast is evaluated
// against the size that is actually rendered.
for (const [label, viewport] of [
  ['desktop', { width: 1400, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
]) {
  for (const [name, path] of [
    ['home', '/'],
    ['privacy', '/privacy'],
    ['terms', '/terms'],
  ]) {
    test(`${name} has no accessibility violations (${label})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(path, { waitUntil: 'load' });
      await page.locator('nav').first().waitFor();
      await revealAll(page);

      await page.addScriptTag({ content: AXE });
      const violations = await page.evaluate(async () => {
        const res = await window.axe.run(document, { resultTypes: ['violations'] });
        return res.violations.flatMap(v =>
          v.nodes.map(n => ({
            id: v.id,
            impact: v.impact,
            target: (n.target || []).join(' '),
            message: n.any?.[0]?.message || n.all?.[0]?.message || v.help || '',
          }))
        );
      });

      expect(
        violations,
        `axe-core violations:\n${violations
          .map(v => `  [${v.impact}] ${v.id}\n    ${v.target}\n    ${v.message}`)
          .join('\n')}`
      ).toEqual([]);
    });
  }
}
