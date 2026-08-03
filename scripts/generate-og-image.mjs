/**
 * @file generate-og-image.mjs
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Renders public/og-image.svg to public/og-image.png — the 1200×630
 * card every Slack, LinkedIn, iMessage and Twitter unfurl shows.
 *
 * Why this exists: the SVG and the PNG were hand-synced. They were last touched
 * in *different* commits (#127 and #137), and the drift finally showed when the
 * job title changed — index.html, the hero and the timeline all said "Senior
 * Software Engineer" while the card everyone actually sees still said "SOFTWARE
 * ENGINEER". Nothing could catch that, because a PNG's contents are opaque to
 * grep, to Prettier and to the test suite.
 *
 * So the PNG is now generated, and it carries the hash of the SVG it came from
 * in a tEXt chunk. socialCard.test.js reads that hash back and fails when it
 * doesn't match the current SVG — an exact staleness check that costs no
 * rendering and no OCR.
 *
 * Run it with `npm run og:build` after editing the SVG.
 *
 * ── Why the hand-rolled quantiser ───────────────────────────────────────────
 * Chrome screenshots 24-bit RGB: 400 KB for this image, against the 74 KB that
 * commit #137 deliberately optimised it down to. Shipping a 5× regression to
 * undo a past performance decision isn't on, and the alternatives were worse:
 * `sharp` is a heavy native dependency for one occasional script (and is only
 * in node_modules here transitively — `npm ls sharp` is empty, so it would
 * vanish on npm ci), and Pillow would put Python in a Node repo's build path.
 * Median cut plus a palette-PNG encoder is ~120 lines against zlib, which ships
 * with Node.
 *
 * PALETTE_SIZE was picked by measuring, not taste. Mean quantisation error per
 * pixel against the source render: 48 → 6.46, 96 → 5.54, 128 → 5.48, 256 →
 * 4.97. It plateaus after 96, and 48 is visibly short — the aurora circles get
 * a hard stair-step edge you can see at a glance. 96 costs 28 KB, which is
 * *smaller* than the 74 KB file it replaces: that one was dithered, and dither
 * noise is expensive to deflate. Same reason there's no dithering here.
 *
 * Deliberately NOT wired into `npm run build`: it needs a browser and the
 * Google Fonts CDN, so a network blip would break every deploy to regenerate a
 * file that changes twice a year. The test is what keeps it honest.
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SVG_PATH = resolve(repoRoot, 'public/og-image.svg');
const PNG_PATH = resolve(repoRoot, 'public/og-image.png');

export const WIDTH = 1200;
export const HEIGHT = 630;
export const PALETTE_SIZE = 96;

/** The key the source-SVG hash is stored under, inside the PNG's tEXt chunk. */
export const SOURCE_KEYWORD = 'og-source-sha256';

/** The font stylesheet index.html loads. `display=block` so no glyph paints in
 *  a fallback face while the real one is still in flight. */
const FONT_CSS =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700' +
  '&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=block';

export const sourceHash = svg => createHash('sha256').update(svg).digest('hex');

// ── PNG encoding ────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

const crc32 = buf => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

/** One PNG chunk: length, type, data, CRC over type+data. */
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

/**
 * Encodes indexed pixels as a colour-type-3 PNG.
 *
 * Every scanline uses filter 0 (None). The usual reason to filter is to help
 * compression find structure in continuous-tone data, but palette indices carry
 * no arithmetic meaning — index 7 is not "between" 6 and 8 — so Sub/Up/Paeth
 * tend to produce noise here rather than runs.
 */
export const encodeIndexedPng = ({ width, height, indices, palette, text = {} }) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 3; // colour type: indexed
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // non-interlaced

  const plte = Buffer.alloc(palette.length * 3);
  palette.forEach(([r, g, b], i) => {
    plte[i * 3] = r;
    plte[i * 3 + 1] = g;
    plte[i * 3 + 2] = b;
  });

  const raw = Buffer.alloc(height * (width + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width + 1)] = 0; // filter: None
    indices.copy
      ? indices.copy(raw, y * (width + 1) + 1, y * width, (y + 1) * width)
      : Buffer.from(indices.subarray(y * width, (y + 1) * width)).copy(raw, y * (width + 1) + 1);
  }

  const textChunks = Object.entries(text).map(([k, v]) =>
    chunk('tEXt', Buffer.from(`${k}\0${v}`, 'latin1'))
  );

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('PLTE', plte),
    ...textChunks,
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

/** Reads a tEXt value straight out of PNG bytes, without decoding the image. */
export const readPngText = (buf, keyword) => {
  let off = 8;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('latin1', off + 4, off + 8);
    if (type === 'tEXt') {
      const data = buf.toString('latin1', off + 8, off + 8 + len);
      const nul = data.indexOf('\0');
      if (data.slice(0, nul) === keyword) return data.slice(nul + 1);
    }
    if (type === 'IEND') break;
    off += 12 + len;
  }
  return null;
};

// ── Median-cut quantisation ─────────────────────────────────────────────────

/**
 * Splits colour space into `size` boxes, repeatedly halving whichever box spans
 * the widest single channel, and returns each box's weighted mean.
 *
 * Splitting on the widest *range* rather than the largest population is what
 * keeps the brand colours: this image is overwhelmingly near-black background,
 * so a population-driven split spends its whole budget there and the mint
 * eyebrow collapses to grey. Measured — at 32 colours it did exactly that.
 */
export const medianCutPalette = (counts, size) => {
  let boxes = [
    [...counts.entries()].map(([key, n]) => [key >> 16, (key >> 8) & 255, key & 255, n]),
  ];

  while (boxes.length < size) {
    let target = -1;
    let widest = -1;
    let axis = 0;
    boxes.forEach((box, i) => {
      if (box.length < 2) return;
      for (let c = 0; c < 3; c++) {
        let lo = 255;
        let hi = 0;
        for (const px of box) {
          if (px[c] < lo) lo = px[c];
          if (px[c] > hi) hi = px[c];
        }
        if (hi - lo > widest) {
          widest = hi - lo;
          target = i;
          axis = c;
        }
      }
    });
    if (target < 0 || widest <= 0) break;

    const box = boxes[target];
    box.sort((a, b) => a[axis] - b[axis]);
    const mid = box.length >> 1;
    boxes.splice(target, 1, box.slice(0, mid), box.slice(mid));
  }

  return boxes.map(box => {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (const px of box) {
      r += px[0] * px[3];
      g += px[1] * px[3];
      b += px[2] * px[3];
      n += px[3];
    }
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  });
};

/** Maps RGBA bytes onto the palette, memoised per distinct colour. */
export const mapToPalette = (rgba, palette) => {
  const indices = new Uint8Array(rgba.length / 4);
  const cache = new Map();
  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
    const key = (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2];
    let idx = cache.get(key);
    if (idx === undefined) {
      let best = 0;
      let bestD = Infinity;
      for (let k = 0; k < palette.length; k++) {
        const dr = rgba[i] - palette[k][0];
        const dg = rgba[i + 1] - palette[k][1];
        const db = rgba[i + 2] - palette[k][2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      }
      idx = best;
      cache.set(key, idx);
    }
    indices[p] = idx;
  }
  return indices;
};

// ── Render ──────────────────────────────────────────────────────────────────

/**
 * Rasterises the SVG in a real browser, with the same webfonts the site loads.
 *
 * The pixels come back through a canvas fed by the *screenshot*, not by the SVG
 * directly: an <img> pointed at an SVG data URL is a separate document that
 * won't fetch the Google Fonts stylesheet, so the text would silently render in
 * fallback faces. Screenshotting the live page first bakes the real glyphs in,
 * and re-reading that PNG through canvas hands back raw RGBA without needing a
 * PNG decoder here.
 */
const renderRgba = async svg => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<!doctype html><html><head>` +
        `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` +
        `<link href="${FONT_CSS}" rel="stylesheet">` +
        `<style>html,body{margin:0;padding:0}svg{display:block}</style>` +
        `</head><body>${svg}</body></html>`,
      { waitUntil: 'networkidle' }
    );
    await page.evaluate(() => document.fonts.ready);

    const shot = await page.screenshot({ type: 'png' });
    return await page.evaluate(
      async ({ dataUrl, w, h }) => {
        const img = new Image();
        img.src = dataUrl;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0);
        return Array.from(canvas.getContext('2d').getImageData(0, 0, w, h).data);
      },
      { dataUrl: `data:image/png;base64,${shot.toString('base64')}`, w: WIDTH, h: HEIGHT }
    );
  } finally {
    await browser.close();
  }
};

export const buildOgImage = async () => {
  const svg = readFileSync(SVG_PATH, 'utf8');
  const rgba = Uint8ClampedArray.from(await renderRgba(svg));

  const counts = new Map();
  for (let i = 0; i < rgba.length; i += 4) {
    const key = (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const palette = medianCutPalette(counts, PALETTE_SIZE);
  const indices = mapToPalette(rgba, palette);

  return encodeIndexedPng({
    width: WIDTH,
    height: HEIGHT,
    indices,
    palette,
    text: { [SOURCE_KEYWORD]: sourceHash(svg) },
  });
};

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const png = await buildOgImage();
  writeFileSync(PNG_PATH, png);
  console.log(`✅ public/og-image.png — ${WIDTH}×${HEIGHT}, ${png.length.toLocaleString()} bytes`);
}
