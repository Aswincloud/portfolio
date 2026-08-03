/**
 * @file labelInName.spec.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description WCAG 2.5.3 "Label in Name": when a control has visible text, its
 *   accessible name must contain that text. A voice-control user says what they
 *   can see — if the wordmark reads "aswincloud" but its accessible name is
 *   "Aswin — home", then "click aswincloud" matches nothing and the control is
 *   simply unreachable by voice.
 *
 *   This lives in e2e rather than unit tests because it has to run against the
 *   rendered accessibility tree, and it is a *test* rather than a lint rule
 *   because nothing else catches it: Lighthouse scored accessibility 100 on
 *   this page while both the wordmark and the send button were failing. 2.5.3
 *   is not machine-detectable in general — you need to know which string is the
 *   visible label — so the audit does not attempt it.
 *
 *   Scoped to controls that have visible text. Icon-only buttons are outside
 *   2.5.3 (no visible label to match) and are covered by needing any accessible
 *   name at all, which the axe rules already enforce.
 */
import { test, expect } from '@playwright/test';

/**
 * Compare the way a speech engine would: case-insensitive, whitespace
 * collapsed, and punctuation dropped so "Résumé" vs "resume" or a trailing
 * ellipsis does not produce a false failure. Deliberately lenient — this should
 * only fire on names that genuinely do not contain the visible words.
 */
const normalise = s =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

test('every labelled control satisfies WCAG 2.5.3 Label in Name', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const violations = await page.evaluate(() => {
    const norm = s =>
      (s || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const found = [];
    for (const el of document.querySelectorAll('a[aria-label], button[aria-label]')) {
      const visible = norm(el.textContent);
      const accessible = norm(el.getAttribute('aria-label'));
      if (!visible) continue; // icon-only — 2.5.3 does not apply
      if (!accessible.includes(visible)) {
        found.push({
          visible: el.textContent.replace(/\s+/g, ' ').trim(),
          accessible: el.getAttribute('aria-label'),
        });
      }
    }
    return found;
  });

  expect(
    violations,
    `accessible name must contain the visible label:\n${violations
      .map(v => `  visible "${v.visible}" vs accessible name "${v.accessible}"`)
      .join('\n')}`
  ).toEqual([]);

  // Pin the two that were actually broken, so a regression names itself rather
  // than only showing up in the generic sweep above. Scoped to the header:
  // "aswincloud" is also the domain, so it appears in a project card and in the
  // contact email, and an unscoped locator matches four links.
  const wordmark = page
    .locator('nav')
    .first()
    .getByRole('link', { name: /aswincloud/i });
  await expect(wordmark).toBeVisible();
  expect(normalise(await wordmark.getAttribute('aria-label'))).toContain('aswincloud');

  const send = page.getByRole('button', { name: /send message/i });
  expect(normalise(await send.getAttribute('aria-label'))).toContain('send message');
});
