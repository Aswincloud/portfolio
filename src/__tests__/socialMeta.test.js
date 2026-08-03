/**
 * @file socialMeta.test.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Guards the attribute family of the social-preview meta tags.
 *
 * Open Graph and Twitter cards look interchangeable but come from different
 * specs: og:* is RDFa and takes `property`, twitter:* is plain HTML metadata
 * and takes `name`. Getting it backwards produces no error anywhere — not in
 * the build, not in the browser, not in the linter. The tags are simply ignored
 * by consumers that don't implement the other spec's fallback, and the only
 * symptom is a link preview that quietly renders without an image.
 *
 * All six twitter:* tags shipped with `property` for exactly that reason:
 * nothing was in a position to complain.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(repoRoot, 'index.html'), 'utf8');
const head = new DOMParser().parseFromString(html, 'text/html');

/** Every <meta> whose og:/twitter: key sits on the given attribute. */
const keysOn = (attr, prefix) =>
  [...head.querySelectorAll(`meta[${attr}^="${prefix}"]`)].map(m => m.getAttribute(attr));

describe('social preview meta tags', () => {
  it('declares Open Graph tags with property=', () => {
    expect(keysOn('property', 'og:')).toContain('og:image');
    expect(keysOn('name', 'og:')).toEqual([]);
  });

  it('declares Twitter card tags with name=', () => {
    expect(keysOn('name', 'twitter:')).toEqual(
      expect.arrayContaining([
        'twitter:card',
        'twitter:url',
        'twitter:title',
        'twitter:description',
        'twitter:image',
        'twitter:image:alt',
      ])
    );
    expect(keysOn('property', 'twitter:')).toEqual([]);
  });

  it('points both card images at the same absolute URL', () => {
    // Relative paths resolve against the crawler, not the page, so a preview
    // image has to be absolute. Both specs need their own copy of it.
    const og = head.querySelector('meta[property="og:image"]')?.getAttribute('content');
    const twitter = head.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
    expect(og).toMatch(/^https:\/\//);
    expect(twitter).toBe(og);
  });
});
