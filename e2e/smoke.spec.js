/**
 * @file e2e/smoke.spec.js
 * @copyright © 2025 Aswin. All rights reserved.
 * @author Aswin
 * @description End-to-end (Playwright) smoke tests for the portfolio site.
 */
import { test, expect } from '@playwright/test';

// Block third-party analytics/chat scripts so the tests measure the app itself,
// not flaky external requests.
test.beforeEach(async ({ page }) => {
  await page.route(/googletagmanager\.com|google-analytics\.com|chatwoot|widget/i, r => r.abort());
});

test('app mounts and renders real content', async ({ page }) => {
  const resp = await page.goto('/');
  expect(resp?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Aswin/i);

  // Deterministic proof React actually rendered. "#root has children" used to
  // be that proof, but no longer is: the build now prerenders a static hero
  // into #root (scripts/vite-plugin-prerender-hero.js), so it has children even
  // if the bundle never executes. What still distinguishes the two is that
  // createRoot() clears the container — so the disappearance of #hero-shell is
  // the mount signal, and it fails closed if React dies.
  const root = page.locator('#root');
  await expect(root).toBeVisible();
  await expect(page.locator('#hero-shell')).toHaveCount(0, { timeout: 15_000 });
  await expect
    .poll(async () => await root.locator(':scope > *').count(), { timeout: 15_000 })
    .toBeGreaterThan(0);

  // A real, user-visible heading is present (not just an empty shell).
  await expect(page.getByRole('heading').first()).toBeVisible();
});

test('no uncaught exceptions from the app on load', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  // Wait for the app to actually render rather than a fixed timeout.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#root > *').first()).toBeVisible({ timeout: 15_000 });
  expect(pageErrors, 'uncaught exceptions on load').toEqual([]);
});

// The whole point of the prerender is the no-JS reader, so that is what this
// asserts — with scripts off, not merely "before the bundle runs". Without it
// the shell could regress to empty and every other test would still pass,
// because they all run JS.
test.describe('prerendered hero (JavaScript disabled)', () => {
  test.use({ javaScriptEnabled: false });

  test('the headline and intro are in the served HTML', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText(/AI accelerators/i);

    // Visible, not merely present: a prerender that ships the copy at opacity 0
    // is worse than none — it reads as cloaking and helps no one.
    await expect(h1).toHaveCSS('opacity', '1');

    await expect(page.locator('#hero-shell p').last()).toContainText(/profile, benchmark/i);
  });
});
