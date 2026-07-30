/**
 * @file csp.spec.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Verifies the generated Content-Security-Policy in `dist/_headers` does
 * not break the site.
 *
 * A CSP is only trustworthy once a real browser has enforced it. `vite preview` ignores
 * `_headers`, so these tests serve the production bundle through
 * scripts/serve-with-headers.js (which replays `_headers` the way Cloudflare's assets
 * runtime does) and fail on any violation — which would otherwise reach visitors as a
 * silently broken page.
 */
import { expect, test } from '@playwright/test';
import { createHeadersServer } from '../scripts/serve-with-headers.js';

// Playwright's webServer already ran `npm run build`, so dist/_headers exists.
let server;
let base;

test.beforeAll(async () => {
  server = await createHeadersServer('dist');
  base = server.url;
});

test.afterAll(async () => {
  await server?.close();
});

/** Collect CSP violations reported while `run` executes. */
async function withViolations(page, run) {
  const violations = [];
  page.on('console', msg => {
    const text = msg.text();
    if (/content security policy|refused to (load|execute|apply|connect)/i.test(text)) {
      violations.push(text);
    }
  });
  // Chromium also fires securitypolicyviolation for blocked inline script/style.
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', e => {
      window.__cspViolations.push(`${e.violatedDirective} blocked ${e.blockedURI}`);
    });
  });
  await run();
  const inPage = await page.evaluate(() => window.__cspViolations ?? []);
  return [...violations, ...inPage];
}

test.describe('Content-Security-Policy', () => {
  test('home page renders with no CSP violations', async ({ page }) => {
    const violations = await withViolations(page, async () => {
      await page.goto(`${base}/`, { waitUntil: 'load' });
      // A blocked module script leaves #root empty — the failure mode that matters most.
      await expect(page.locator('#root > *').first()).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(1500); // let async/deferred scripts attempt to run
    });
    expect(violations, `CSP violations:\n${violations.join('\n')}`).toEqual([]);
  });

  test('inline bootstrap scripts are authorised by their hashes', async ({ page }) => {
    // Block the third-party scripts so the only thing that can produce the effects
    // asserted below is the inline block itself. Without this the test is not
    // load-bearing: real GTM and src/utils/analytics.js both define window.gtag, so
    // it would pass even with a wrong hash.
    await page.route(/googletagmanager\.com|google-analytics\.com|support\.aswincloud\.com/i, r =>
      r.abort()
    );
    await page.goto(`${base}/`, { waitUntil: 'load' });

    // `page_title: 'Aswin Portfolio'` is pushed only by the inline gtag block
    // (analytics.js uses document.title, which differs).
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            (window.dataLayer ?? []).some(entry =>
              Array.from(entry ?? []).some(arg => arg?.page_title === 'Aswin Portfolio')
            )
          ),
        { timeout: 15_000 }
      )
      .toBe(true);

    // The Chatwoot loader is a separate inline block with its own hash; it injects
    // this <script> element even though we aborted the request.
    await expect
      .poll(
        () =>
          page.evaluate(
            () => !!document.querySelector('script[src*="support.aswincloud.com/packs/js/sdk.js"]')
          ),
        { timeout: 15_000 }
      )
      .toBe(true);
  });

  test('inline onload handler on the font stylesheet is allowed', async ({ page }) => {
    await page.goto(`${base}/`, { waitUntil: 'load' });
    // The stylesheet ships as media="print" and its onload flips it to "all". Without
    // 'unsafe-hashes' + the handler hash it would stay "print" and the webfonts would
    // never apply.
    await expect
      .poll(
        () =>
          page.evaluate(
            () => document.querySelector('link[href*="fonts.googleapis.com"][onload]')?.media
          ),
        { timeout: 15_000 }
      )
      .toBe('all');
  });

  test('SPA deep links are served the policy too', async ({ page }) => {
    const response = await page.goto(`${base}/privacy`, { waitUntil: 'load' });
    const csp = response.headers()['content-security-policy'];
    expect(csp).toBeTruthy();
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    // 'unsafe-inline' in script-src would silently void every hash above.
    const scriptSrc = csp.split(';').find(d => d.trim().startsWith('script-src'));
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    await expect(page.locator('#root > *').first()).toBeVisible({ timeout: 15_000 });
  });

  test('security headers are present on asset responses', async ({ request }) => {
    const headers = (await request.get(`${base}/`)).headers();
    expect(headers['strict-transport-security']).toContain('max-age=31536000');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('shipped bundles do not reference source maps', async ({ request }) => {
    const html = await (await request.get(`${base}/`)).text();
    const entry = html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
    expect(entry, 'entry bundle in index.html').toBeTruthy();
    const js = await (await request.get(`${base}${entry}`)).text();
    expect(js).not.toContain('sourceMappingURL');
  });
});
