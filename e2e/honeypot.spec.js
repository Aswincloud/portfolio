/**
 * @file honeypot.spec.js
 * @copyright © 2025 Aswin. All rights reserved.
 * @author Aswin
 * @description Browser checks for the contact-form honeypot.
 *
 * The unit tests assert on attributes; only a real browser can confirm the field is
 * actually off-screen and does not affect layout. If the honeypot ever became visible
 * it would look like a bug to visitors, and if it moved into the viewport a real person
 * could fill it in and have their message silently dropped.
 */
import { test, expect } from '@playwright/test';

const HONEYPOT = 'input[name="company"]';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.locator('#contact-name').waitFor({ state: 'visible' });
});

test('honeypot exists in the DOM so bots can find it', async ({ page }) => {
  await expect(page.locator(HONEYPOT)).toHaveCount(1);
});

test('honeypot is entirely off-screen, not merely covered', async ({ page }) => {
  // Deliberately not `toBeHidden()`: Playwright treats an off-screen element with a
  // bounding box as "visible", and it would equally accept a field hidden under an
  // opaque overlay — which a visitor could still reach. Assert on real geometry instead.
  const box = await page.locator(HONEYPOT).boundingBox();
  expect(box).not.toBeNull();
  expect(box.x + box.width).toBeLessThan(0);
});

test('honeypot does not create a horizontal scrollbar', async ({ page }) => {
  // The classic failure of the -9999px technique: the off-screen field widens the
  // document and every page gains a horizontal scrollbar.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('honeypot wrapper occupies no layout space', async ({ page }) => {
  // If the wrapper stopped being absolutely positioned and zero-sized it would push
  // the real fields down — visible breakage rather than a silent one.
  const wrapper = await page.evaluate(() => {
    const r = document.querySelector('input[name="company"]').parentElement.getBoundingClientRect();
    return { width: r.width, height: r.height };
  });
  expect(wrapper.width).toBe(0);
  expect(wrapper.height).toBe(0);
});

test('tabbing through the form never lands on the honeypot', async ({ page }) => {
  await page.locator('#contact-name').focus();
  for (let i = 0; i < 10; i += 1) {
    await page.keyboard.press('Tab');
    const focusedName = await page.evaluate(() => document.activeElement?.getAttribute('name'));
    expect(focusedName).not.toBe('company');
  }
});

test('a genuine submission posts the honeypot empty', async ({ page }) => {
  let posted = null;
  await page.route('**/api/contact', async route => {
    posted = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'ok' }),
    });
  });

  await page.locator('#contact-name').fill('Jane Doe');
  await page.locator('#contact-email').fill('jane@example.com');
  await page.locator('#contact-message').fill('Hello, I would like to discuss a project.');
  await page.getByRole('button', { name: /send message/i }).click();

  await expect(page.getByText(/message sent successfully/i)).toBeVisible();
  expect(posted).not.toBeNull();
  expect(posted.company).toBe('');
  expect(posted.name).toBe('Jane Doe');
});
