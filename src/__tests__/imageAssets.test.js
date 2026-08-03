/**
 * @file imageAssets.test.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Guards the raster assets in public/ against being replaced with
 *   the full-resolution originals again.
 *
 *   The company logos render in a 48px box (ExperienceEntry's `h-14 w-14` minus
 *   `p-2`) and shipped at 1500×1060 and 1600×533 — 137 KB of bytes to draw 96
 *   pixels of logo, 31× and 33× oversampled. `loading='lazy'` deferred the cost
 *   but didn't remove it. They're in public/, so Vite never touches them: the
 *   file on disk is the file the browser downloads, and nothing but this test
 *   stands between a fresh download from a press kit and 137 KB going back.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const at = relative => resolve(repoRoot, relative);

/**
 * Pixel dimensions from the file header — no image library needed, and this repo
 * deliberately has none it can rely on (`sharp` is present transitively but
 * absent from package.json, so it vanishes on `npm ci`).
 */
const dimensions = file => {
  const buf = readFileSync(file);
  // PNG: IHDR width/height are the two big-endian u32s at byte 16.
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // JPEG: walk the segment chain to the start-of-frame marker, which carries the
  // real dimensions. EXIF thumbnails earlier in the file would fool a naive scan
  // for 0xFFC0, so this follows segment lengths rather than searching for bytes.
  let off = 2; // skip SOI
  while (off < buf.length) {
    if (buf[off] !== 0xff) throw new Error(`not a JPEG segment at ${off} in ${file}`);
    const marker = buf[off + 1];
    const length = buf.readUInt16BE(off + 2);
    // SOF0/1/2/9/10 — the frame headers that carry dimensions. Excludes 0xC4
    // (DHT), 0xC8 (JPG) and 0xCC (DAC), which share the 0xCn range.
    if ([0xc0, 0xc1, 0xc2, 0xc9, 0xca].includes(marker)) {
      return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) };
    }
    off += 2 + length;
  }
  throw new Error(`no SOF marker in ${file}`);
};

/**
 * The logos, with the box they render into. 48 CSS px of content, so 96 covers a
 * 2× display exactly; 3× phones downscale a touch, which is invisible on a logo
 * and cheaper than shipping 144px to everyone.
 */
const LOGOS = [
  { file: 'public/MulticoreWare_Logo.jpg', maxEdge: 96, maxBytes: 8_000 },
  { file: 'public/Lenovo_Global_Corporate_Logo.png', maxEdge: 96, maxBytes: 8_000 },
];

describe('company logos', () => {
  it('are sized for the 48px box they render into', () => {
    for (const logo of LOGOS) {
      const { width, height } = dimensions(at(logo.file));
      expect(Math.max(width, height), `${logo.file} is ${width}×${height}`).toBeLessThanOrEqual(
        logo.maxEdge
      );
      // Guard the other direction too: a 1×1 placeholder would pass the above.
      expect(Math.max(width, height), `${logo.file} looks degenerate`).toBeGreaterThan(32);
    }
  });

  it('cost kilobytes, not tens of kilobytes', () => {
    for (const logo of LOGOS) {
      const { size } = statSync(at(logo.file));
      expect(size, `${logo.file} is ${size} B`).toBeLessThan(logo.maxBytes);
    }
  });

  it('are the files the experience data actually points at', () => {
    // The size guard is worthless if the component renders some other file.
    const data = readFileSync(at('src/data/experienceData.js'), 'utf8');
    for (const logo of LOGOS) {
      const publicPath = logo.file.replace(/^public/, '');
      expect(data, `${publicPath} is not referenced`).toContain(`'${publicPath}'`);
    }
  });

  it('render at an explicit width and height, so they reserve layout space', () => {
    // Without both attributes the card reflows when the logo arrives — a CLS hit
    // that Lighthouse scores and that this repo has already paid for elsewhere.
    const entry = readFileSync(at('src/components/ExperienceEntry.jsx'), 'utf8');
    expect(entry).toMatch(/width=\{\d+\}/);
    expect(entry).toMatch(/height=\{\d+\}/);
  });
});

describe('dimension parsing', () => {
  // The JPEG walker above is the kind of code that silently returns a plausible
  // wrong number, so pin it against the real files' known sizes.
  it('reads the JPEG SOF dimensions, not an EXIF thumbnail', () => {
    expect(dimensions(at('public/MulticoreWare_Logo.jpg'))).toEqual({ width: 96, height: 68 });
  });

  it('reads PNG IHDR dimensions', () => {
    expect(dimensions(at('public/Lenovo_Global_Corporate_Logo.png'))).toEqual({
      width: 96,
      height: 32,
    });
    // og-image.png is generated at exactly 1200×630 — a second, independent PNG
    // to prove the reader isn't just echoing the expectation.
    expect(dimensions(at('public/og-image.png'))).toEqual({ width: 1200, height: 630 });
  });
});
