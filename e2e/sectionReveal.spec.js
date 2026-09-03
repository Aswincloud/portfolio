/**
 * @file sectionReveal.spec.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Every section actually becomes visible when scrolled to.
 *
 *   Eight components gate their content on `useInView` from
 *   react-intersection-observer, and each renders at opacity 0 until it fires.
 *   If the hook regresses, the sections never reveal and the site is a mostly
 *   blank page.
 *
 *   The unit suite cannot catch that. setupTests.js mocks IntersectionObserver
 *   as a no-op that never invokes its callback, and no unit test renders a
 *   section anyway — so all 248 of them pass whether useInView works or not.
 *
 *   Counting nodes stuck at opacity 0 rather than asserting on a single element
 *   because the failure is diffuse: a broken observer leaves the whole subtree
 *   hidden, and a count says how much rather than just that something is wrong.
 *
 *   The count has to be polled, not sampled. Measured immediately after
 *   scrolling, a healthy #technologies reports 25 nodes at opacity 0 and drains
 *   to 0 by ~800ms — the reveals are ~0.6s transitions, so a single reading
 *   fails on working code. Polling to a deadline keeps the assertion honest in
 *   the other direction too: a dead observer never drains, so the budget
 *   expires and the final counts are what gets reported.
 */
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/googletagmanager\.com|google-analytics\.com|chatwoot|widget/i, r => r.abort());
});

const SECTIONS = ['about', 'experience', 'projects', 'technologies', 'contact'];

/** Laid-out descendants, and how many of them are still fully transparent. */
const measure = el => {
  const rendered = [...el.querySelectorAll('*')].filter(e => e.getBoundingClientRect().height > 0);
  return {
    rendered: rendered.length,
    hidden: rendered.filter(e => parseFloat(getComputedStyle(e).opacity) < 0.05).length,
  };
};

/** Poll until nothing is hidden, or the reveal budget runs out. */
const settle = async (section, budgetMs = 5000) => {
  const deadline = Date.now() + budgetMs;
  let counts = await section.evaluate(measure);
  while (counts.hidden > 0 && Date.now() < deadline) {
    await section.page().waitForTimeout(100);
    counts = await section.evaluate(measure);
  }
  return counts;
};

test('every section reveals its content once scrolled into view', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('/', { waitUntil: 'load' });

  const stillHidden = [];

  for (const id of SECTIONS) {
    const section = page.locator(`#${id}`);
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();

    const counts = await settle(section);

    // A section that rendered nothing would trivially report zero hidden nodes.
    expect(counts.rendered, `#${id} rendered no laid-out content at all`).toBeGreaterThan(10);
    if (counts.hidden > 0)
      stillHidden.push(`#${id}: ${counts.hidden}/${counts.rendered} at opacity 0`);
  }

  expect(
    stillHidden,
    `sections never revealed — useInView is likely not firing:\n  ${stillHidden.join('\n  ')}`
  ).toEqual([]);
});

test('the assertion above fails when the observer never fires', async ({ page }) => {
  // Guards the guard. Neutering IntersectionObserver reproduces exactly the
  // regression this file exists to catch, so if the reveal test can pass with a
  // dead observer, it is not testing anything.
  await page.addInitScript(() => {
    window.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    };
  });

  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('/', { waitUntil: 'load' });

  const section = page.locator('#technologies');
  await section.scrollIntoViewIfNeeded();
  await expect(section).toBeVisible();

  const counts = await settle(section, 2000);
  expect(
    counts.hidden,
    'a no-op IntersectionObserver left nothing hidden — the reveal test cannot fail'
  ).toBeGreaterThan(0);
});
