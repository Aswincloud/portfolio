/**
 * @file uiAffordances.spec.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description The mobile menu's dismissal affordances, in a real browser at a
 *   real phone width.
 *
 *   These have a jsdom counterpart in src/__tests__/uiAffordances.test.jsx, and
 *   the duplication is deliberate: the scroll lock is the one assertion jsdom
 *   cannot make honestly. jsdom has no layout and no scrolling, so it can only
 *   check that `overflow: hidden` was written to the element — not that the page
 *   then refuses to move. This file scrolls and reads window.scrollY, which is how
 *   the bug was found in the first place (the sheet stayed pinned while the page
 *   ran to y=600 underneath it).
 */

import { test, expect } from '@playwright/test';

const PHONE = { width: 390, height: 844 };

test.describe('mobile menu dismissal', () => {
  test.use({ viewport: PHONE });

  test('locks the page behind the open sheet', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /open menu/i }).click();
    await expect(page.getByRole('button', { name: /close menu/i })).toBeVisible();

    await page.mouse.wheel(0, 600);
    // Give the scroll a chance to happen, so a pass means "it didn't" rather
    // than "we checked too early".
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('restores scrolling once dismissed', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /open menu/i }).click();
    await expect(page.getByRole('button', { name: /close menu/i })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /open menu/i })).toBeVisible();

    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });

  test('Escape and an outside tap both close it', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /open menu/i }).click();
    await expect(page.getByRole('button', { name: /close menu/i })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /close menu/i })).toBeHidden();

    await page.getByRole('button', { name: /open menu/i }).click();
    await expect(page.getByRole('button', { name: /close menu/i })).toBeVisible();
    // Well below the nav, on the hero.
    await page.mouse.click(195, 700);
    await expect(page.getByRole('button', { name: /close menu/i })).toBeHidden();
  });

  test('a tap on a menu link still navigates rather than being eaten', async ({ page }) => {
    // The outside-press listener runs on pointerdown, which fires before the
    // link's click. If the sheet were outside the ref'd <nav>, dismissing would
    // unmount the link mid-gesture and the navigation would be lost.
    await page.goto('/');
    await page.getByRole('button', { name: /open menu/i }).click();
    await page.getByRole('button', { name: 'Contact' }).click();

    await expect(page.getByRole('button', { name: /close menu/i })).toBeHidden();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });
});
