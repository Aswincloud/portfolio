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
 *   This is a *test* rather than a lint rule because nothing else catches it.
 *   Lighthouse does run the corresponding audit — and scored it 0 on this page
 *   while reporting accessibility 100, because the audit carries
 *   `weight: 0, group: "hidden"` and contributes nothing to the category. 2.5.3
 *   is not machine-detectable in general (you have to know which string is the
 *   visible label), so nothing else was going to flag it either.
 *
 *   It lives in e2e because the accessible name is *computed* — it can come from
 *   aria-label, aria-labelledby, or the element's own content, and the icon
 *   inside a button may or may not contribute. Only a real browser knows.
 *   Playwright's ariaSnapshot() exposes exactly that computed name, so the sweep
 *   below compares against what a screen reader would actually announce rather
 *   than re-deriving it from attributes.
 *
 *   Controls with no visible text (icon-only) are outside 2.5.3 — there is no
 *   label to match — and are covered instead by needing any accessible name at
 *   all, which the axe rules already enforce.
 */
import { test, expect } from '@playwright/test';

/**
 * Compare the way a speech engine would: case-insensitive, whitespace
 * collapsed, and punctuation and accents dropped, so "Résumé" against
 * "View résumé (opens in a new tab)" does not produce a false failure.
 * Deliberately lenient — this should only fire on names that genuinely do not
 * contain the visible words.
 */
const normalise = s =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Every link and button on the page, paired with its visible text and the
 * accessible name the browser actually computed for it.
 */
const controls = async scope =>
  scope.locator('a, button').evaluateAll(els =>
    els
      // Only what is actually rendered at this viewport. A display:none control
      // is not in the accessibility tree, so there is no computed name to check
      // it against — this page has responsive variants of the same button
      // (`sm:hidden` / `hidden sm:inline-flex`) and at any one width half of
      // them are inert. The test runs at two widths so both halves get covered.
      .filter(el => el.getClientRects().length > 0)
      .map(el => ({
        visible: el.innerText || el.textContent || '',
        // The name computation for the two shapes this page uses: an explicit
        // aria-label wins, otherwise the element is named by its own content.
        // Cross-checked against the browser's real computed names below, so if a
        // control ever appears that this doesn't model (aria-labelledby, a title,
        // a non-hidden icon contributing text) the test says so instead of
        // quietly checking the wrong string.
        accessible: el.getAttribute('aria-label') || el.textContent || '',
        tag: el.tagName.toLowerCase(),
      }))
  );

/**
 * The accessible names the browser actually computed, pulled out of Playwright's
 * aria snapshot — lines look like `- link "aswincloud — home":`.
 */
const computedNames = async scope => {
  const snapshot = await scope.ariaSnapshot();
  return [...snapshot.matchAll(/^\s*-\s+(?:link|button)\s+"([^"]*)"/gm)].map(m => normalise(m[1]));
};

// Both widths, because the page swaps controls at the `sm` breakpoint rather
// than restyling them: the hero's "Live chat" and the nav's menu sheet exist
// only below 640px, the résumé link only above. Sweeping one width silently
// skips whichever half is display:none.
for (const [label, viewport] of [
  ['desktop', { width: 1400, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
]) {
  test(`every labelled control satisfies WCAG 2.5.3 Label in Name (${label})`, async ({ page }) => {
    await page.setViewportSize(viewport);
    // `load`, not `networkidle`: every other spec in this repo waits on a
    // deterministic signal, and networkidle hangs on a page that keeps any
    // long-lived connection open. The locator below waits for what it needs.
    await page.goto('/', { waitUntil: 'load' });
    await page.locator('nav').first().waitFor();

    // Open the mobile menu so the sheet's links are rendered and checkable —
    // otherwise the whole mobile nav is display:none and gets skipped.
    const menu = page.getByRole('button', { name: /open menu/i });
    if (await menu.isVisible()) await menu.click();

    const labelled = (await controls(page)).filter(c => normalise(c.visible));

    // Guard the model above before trusting it: every name it derived must be
    // one the browser actually computed. Without this the sweep could compare
    // against a string no assistive tech ever sees and still report green.
    const real = await computedNames(page.locator('body'));
    const unmodelled = labelled.filter(c => !real.includes(normalise(c.accessible)));
    expect(
      unmodelled.map(c => `<${c.tag}> "${c.accessible}"`),
      'derived accessible name is not one the browser computed — the model in ' +
        'controls() no longer covers every control on this page'
    ).toEqual([]);

    const violations = labelled.filter(
      c => !normalise(c.accessible).includes(normalise(c.visible))
    );

    expect(
      violations,
      `accessible name must contain the visible label:\n${violations
        .map(v => `  <${v.tag}> visible "${v.visible.trim()}" vs accessible name "${v.accessible}"`)
        .join('\n')}`
    ).toEqual([]);

    // The sweep is only meaningful if it saw something; a selector that silently
    // matched nothing would also report zero violations.
    expect(labelled.length).toBeGreaterThan(10);
  });
}

test('the wordmark is reachable by the name it displays', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  // Scoped to the nav: "aswincloud" is also the domain, so it appears in a
  // project card and in the contact email, and an unscoped locator matches four
  // links. getByRole matches on the *computed* accessible name, so this passing
  // is itself the assertion — a voice-control user saying "aswincloud" reaches
  // this link.
  await expect(
    page
      .locator('nav')
      .first()
      .getByRole('link', { name: /aswincloud/i })
  ).toBeVisible();
});

test('the submit button keeps its name in the submitting state', async ({ page }) => {
  await page.goto('/#contact', { waitUntil: 'load' });

  const send = page.getByRole('button', { name: /send message/i });
  await expect(send).toBeVisible();

  // The regression this guards: the button's visible text swaps to "Sending…"
  // while in flight. A static aria-label would still say "Send message" then —
  // a fresh 2.5.3 mismatch in a state no static check ever looks at. The button
  // is named by its content instead, so the two cannot drift.
  await page.route('**/api/contact', () => {}); // never resolves: hold the pending state
  // Filled by id, matching contactFailure.spec.js — getByLabel(/email/i) also
  // matches the "Visit Email profile" social link further down the section.
  await page.locator('#contact-name').fill('Test');
  await page.locator('#contact-email').fill('test@example.com');
  await page.locator('#contact-message').fill('Hello');
  await send.click();

  const sending = page.getByRole('button', { name: /sending/i });
  await expect(sending).toBeVisible();
  const snapshot = await sending.ariaSnapshot();
  expect(normalise(snapshot)).toContain('sending');
});
