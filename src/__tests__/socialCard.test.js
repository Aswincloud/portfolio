/**
 * @file socialCard.test.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Guards the OG card — the 1200×630 image every Slack, LinkedIn and
 *   iMessage unfurl shows. It's the one asset nothing else can check: a PNG's
 *   contents are opaque to grep, to Prettier and to eslint, so when the job title
 *   changed everywhere else, the card kept saying "SOFTWARE ENGINEER" and no gate
 *   noticed. These tests close that specific hole.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readPngText, sourceHash, SOURCE_KEYWORD } from '../../scripts/generate-og-image.mjs';
import { HERO_EYEBROW } from '../data/heroContent.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = relative => readFileSync(resolve(repoRoot, relative), 'utf8');

const svg = read('public/og-image.svg');
const png = readFileSync(resolve(repoRoot, 'public/og-image.png'));

/** The card's eyebrow, in the SVG's uppercase, letterspaced form. */
const roleOf = eyebrow => eyebrow.split('·')[0].trim().toUpperCase();

describe('og-image.svg', () => {
  it('states the same role as the hero', () => {
    // The drift this whole file exists for: the SVG said SOFTWARE ENGINEER while
    // heroContent, index.html and the timeline all said Senior. Deriving the
    // expectation from HERO_EYEBROW means the next title change fails here
    // rather than shipping quietly to every unfurl.
    expect(svg).toContain(`>${roleOf(HERO_EYEBROW)}<`);
  });

  it('renders its text as <text>, not as paths', () => {
    // If someone ever "optimises" the SVG by converting text to outlines, the
    // assertion above would pass on a stale string in a comment while the drawn
    // glyphs said something else. Requiring live text keeps it meaningful.
    expect(svg).toMatch(/<text[^>]*>/);
    expect(svg).not.toMatch(/<path[^>]*d="[^"]{400,}"/);
  });
});

describe('og-image.png', () => {
  it('was generated from the current SVG', () => {
    // Exact staleness check, no rendering and no OCR: the generator stamps the
    // hash of the SVG it read into a tEXt chunk. Edit the SVG without running
    // `npm run og:build` and this fails with the two hashes side by side.
    const stamped = readPngText(png, SOURCE_KEYWORD);
    expect(stamped, 'no source stamp — regenerate with `npm run og:build`').toBeTruthy();
    expect(stamped, 'og-image.png is stale — run `npm run og:build`').toBe(sourceHash(svg));
  });

  it('is a 1200×630 PNG, the size the meta tags promise', () => {
    // index.html advertises og:image:width/height. A card whose real dimensions
    // disagree gets cropped or rejected by some scrapers.
    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);

    const html = read('index.html');
    expect(html).toContain('content="1200"');
    expect(html).toContain('content="630"');
  });

  it('stays under 300 KB, the size scrapers reliably fetch', () => {
    // WhatsApp caps around 300 KB and Twitter at 5 MB; the practical floor is
    // WhatsApp's. Well under it today — this catches a future switch to an
    // unquantised export, which would be ~400 KB.
    expect(png.length).toBeLessThan(300_000);
  });
});
