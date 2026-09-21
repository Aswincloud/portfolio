/**
 * @file e2e/liveChatButton.spec.js
 * @copyright © 2025 Aswin. All rights reserved.
 * @author Aswin
 * @description The hero "Live chat" button (mobile only) must open the Chatwoot
 * panel and leave it open. The outside-click closer in index.html has to ignore
 * the very tap that opened it — otherwise open/close fire in one gesture and the
 * panel never paints.
 */
import { test, expect, devices } from '@playwright/test';

// iPhone viewport + touch, but on Chromium: CI installs only that browser.
test.use({ ...devices['iPhone 13'], defaultBrowserType: 'chromium' });

// The real SDK is blocked (as in the other specs); a tiny stand-in records the
// toggle() calls and mirrors the DOM contract index.html reads: the panel holder
// carries `woot--hide` while closed.
test.beforeEach(async ({ page }) => {
  await page.route(
    /googletagmanager\.com|google-analytics\.com|chatwoot|support\.aswincloud\.com/i,
    r => r.abort()
  );
  await page.addInitScript(() => {
    const calls = [];
    window.__cwCalls = calls;
    const ensureDom = () => {
      if (document.querySelector('.woot-widget-holder')) return;
      const holder = document.createElement('div');
      holder.id = 'cw-widget-holder';
      holder.className = 'woot-widget-holder woot--hide';
      const bubble = document.createElement('div');
      bubble.id = 'cw-bubble-holder';
      bubble.className = 'woot--bubble-holder';
      document.body.append(holder, bubble);
    };
    window.$chatwoot = {
      isOpen: false,
      toggle(state) {
        ensureDom();
        calls.push(state);
        const open = state === 'open' ? true : state === 'close' ? false : !this.isOpen;
        this.isOpen = open;
        document.querySelector('.woot-widget-holder').classList.toggle('woot--hide', !open);
      },
      toggleBubbleVisibility() {
        ensureDom();
      },
    };
    document.addEventListener('DOMContentLoaded', ensureDom);
  });
});

test('tapping the hero Live chat button opens the panel and leaves it open', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('link', { name: 'Open live chat' });
  await expect(button).toBeVisible();

  await button.tap();

  await expect.poll(() => page.evaluate(() => window.__cwCalls)).toEqual(['open']);
  await expect(page.locator('#cw-widget-holder')).not.toHaveClass(/woot--hide/);
  // The <a href="#contact"> fallback must not have fired either.
  expect(new URL(page.url()).hash).toBe('');
});

test('a tap outside the open panel still closes it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Open live chat' }).tap();
  await expect(page.locator('#cw-widget-holder')).not.toHaveClass(/woot--hide/);

  await page.getByRole('heading').first().tap();

  await expect.poll(() => page.evaluate(() => window.__cwCalls)).toEqual(['open', 'close']);
  await expect(page.locator('#cw-widget-holder')).toHaveClass(/woot--hide/);
});
