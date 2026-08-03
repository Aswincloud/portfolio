/**
 * @file e2e/contactFailure.spec.js
 * @copyright © 2025 Aswin. All rights reserved.
 * @author Aswin
 * @description Browser-level checks that a failed contact submission is reported as a
 *   failure, not a success.
 *
 * The jsdom tests cover the same logic, but the failure this guards against is one a
 * visitor experiences in a real browser: a genuinely aborted request (offline, DNS,
 * CORS) previously produced "Message sent successfully" and a cleared form. Only a real
 * engine actually rejects fetch() the way that path depends on, so it is worth asserting
 * here too — and the mailto href has to survive real URL parsing.
 */
import { test, expect } from '@playwright/test';

const NAME = 'Jane Doe';
const EMAIL = 'jane@example.com';
const MESSAGE = 'Hello, I would like to discuss a project with you.';

test.beforeEach(async ({ page }) => {
  await page.route(/googletagmanager\.com|google-analytics\.com|chatwoot|widget/i, r => r.abort());
});

/** Fill the form with valid values and submit. */
const fillAndSubmit = async page => {
  await page.goto('/#contact');
  await page.locator('#contact-name').fill(NAME);
  await page.locator('#contact-email').fill(EMAIL);
  await page.locator('#contact-message').fill(MESSAGE);
  await page.getByRole('button', { name: /send message/i }).click();
};

test.describe('contact form when delivery fails', () => {
  test('an aborted request is reported as a failure, not a success', async ({ page }) => {
    // A real abort: fetch() rejects with a TypeError in the page, which is exactly the
    // case that used to display success.
    await page.route('**/api/contact', route => route.abort('failed'));
    await fillAndSubmit(page);

    const alert = page.locator('[role="alert"]', { hasText: /wasn't sent|wasn’t sent/ });
    await expect(alert).toBeVisible();
    await expect(page.getByText(/message sent successfully/i)).toHaveCount(0);
  });

  test("the visitor's text is preserved so nothing has to be retyped", async ({ page }) => {
    await page.route('**/api/contact', route => route.abort('failed'));
    await fillAndSubmit(page);

    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('#contact-message')).toHaveValue(MESSAGE);
    await expect(page.locator('#contact-name')).toHaveValue(NAME);
    await expect(page.locator('#contact-email')).toHaveValue(EMAIL);
  });

  test('the mailto fallback is offered and carries the message', async ({ page }) => {
    await page.route('**/api/contact', route => route.abort('failed'));
    await fillAndSubmit(page);

    const link = page.locator('a[href^="mailto:contact@aswincloud.com?"]');
    await expect(link).toBeVisible();

    // Parse it the way the browser will hand it to the mail client.
    const href = await link.getAttribute('href');
    const url = new URL(href);
    expect(url.searchParams.get('body')).toBe(MESSAGE);
    expect(url.searchParams.get('subject')).toContain(NAME);
  });

  test("a 502 from the Worker (email provider down) shows the fallback, not 'check your input'", async ({
    page,
  }) => {
    await page.route('**/api/contact', route =>
      route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, delivered: false, message: 'not delivered' }),
      })
    );
    await fillAndSubmit(page);

    await expect(page.locator('a[href^="mailto:contact@aswincloud.com?"]')).toBeVisible();
    // The validation checklist would be misleading advice: nothing about the input is wrong.
    await expect(page.getByText(/please check/i)).toHaveCount(0);
  });

  test('a 400 shows the validation checklist and no fallback', async ({ page }) => {
    await page.route('**/api/contact', route =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Invalid email address' }),
      })
    );
    await fillAndSubmit(page);

    await expect(page.getByText(/please check/i)).toBeVisible();
    await expect(page.locator('a[href^="mailto:contact@aswincloud.com?"]')).toHaveCount(0);
    await expect(page.getByText(/message sent successfully/i)).toHaveCount(0);
  });

  test('a confirmed delivery still reports success and clears the form', async ({ page }) => {
    // The counterpart to the above: the fix must not make success unreachable.
    await page.route('**/api/contact', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, delivered: true, message: 'ok' }),
      })
    );
    await fillAndSubmit(page);

    await expect(page.getByText(/message sent successfully/i)).toBeVisible();
    await expect(page.locator('#contact-message')).toHaveValue('');
    await expect(page.locator('a[href^="mailto:contact@aswincloud.com?"]')).toHaveCount(0);
  });
});
