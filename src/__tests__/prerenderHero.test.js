/**
 * @file prerenderHero.test.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Guards the build-time hero prerender: that it produces a real
 *   <h1>, that its words come from the same module HeroSection renders, and
 *   that it fails loudly rather than silently if the shell changes shape.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import prerenderHero, { renderHeroShell } from '../../scripts/vite-plugin-prerender-hero.js';
import { HERO_HEADLINE_LINES, HERO_INTRO, splitAround } from '../data/heroContent.js';

// Vite's transform does define __dirname here, so the earlier version worked —
// but it only works under a bundler. Deriving the path from import.meta.url is
// what plain ESM gives us, and it matches assetsignore.test.js, the other test
// that reads repo files off disk.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = relative => readFileSync(resolve(repoRoot, relative), 'utf8');

const runTransform = html => prerenderHero().transformIndexHtml.handler(html);

// Read the shell back by parsing it, not by regex. An earlier version stripped
// tags with `replace(/<[^>]+>/g, '')` and hand-decoded entities; CodeQL flagged
// that as an incomplete multi-character sanitizer and was right to — `<scr<script>ipt>`
// survives a single pass. Nothing untrusted reaches it here, but a test asserting
// on escaping shouldn't itself contain a broken unescaper. Parsing is also simply
// more accurate: textContent decodes entities for free, and the tag set below is
// the elements a browser actually builds rather than the ones a regex can spot.
const parse = html => new DOMParser().parseFromString(html, 'text/html');
const textOf = html => parse(html).body.textContent;

describe('renderHeroShell', () => {
  it('emits exactly one h1 containing the full headline', () => {
    const doc = parse(renderHeroShell());
    const h1s = doc.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe(HERO_HEADLINE_LINES.join(' '));
  });

  it('emits the intro copy verbatim', () => {
    expect(textOf(renderHeroShell())).toContain(HERO_INTRO);
  });

  it('ships nothing hidden — no opacity:0 or display:none', () => {
    // The reason this prerender writes its own markup instead of using
    // renderToStaticMarkup on the real component: that path serialises motion's
    // initial state, which is opacity:0 on ten elements.
    expect(renderHeroShell()).not.toMatch(/opacity\s*:\s*0\b/);
    expect(renderHeroShell()).not.toMatch(/display\s*:\s*none/);
  });

  it('adds no inline script or event handler, so the CSP hash set is unchanged', () => {
    const html = renderHeroShell();
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/\son[a-z]+\s*=/i);
  });

  it('escapes text rather than interpolating it raw', () => {
    // Guard against the copy ever containing a character that would break out
    // of the markup. Only elements this function itself emits should exist —
    // asked of the parsed tree, so it's the elements a browser really builds.
    const doc = parse(renderHeroShell());
    const built = new Set([...doc.body.querySelectorAll('*')].map(el => el.tagName.toLowerCase()));
    expect(built).toEqual(new Set(['div', 'p', 'h1', 'span', 'strong']));
  });
});

describe('the plugin', () => {
  it('injects the hero into an empty #root', () => {
    const out = runTransform('<body><div id="root"></div></body>');
    expect(out).toMatch(/<div id="root"><div id="hero-shell"/);
    expect(out).toContain('</h1>');
  });

  it('throws if #root is not found, rather than silently shipping an empty shell', () => {
    expect(() => runTransform('<body><div id="app"></div></body>')).toThrow(/could not find/i);
  });

  it('matches the real index.html, so the build cannot quietly stop injecting', () => {
    // The throw above only helps if the pattern still matches the real file.
    expect(() => runTransform(read('index.html'))).not.toThrow();
  });
});

describe('single source of copy', () => {
  it('HeroSection contains no hardcoded headline or intro text', () => {
    const src = read('src/components/sections/HeroSection.jsx');
    // Both renderers must read heroContent.js. If someone re-types the sentence
    // into the JSX, the two copies can drift and only one of them is indexed.
    const code = src.replace(/\{\/\*[\s\S]*?\*\/\}/g, ''); // drop JSX comments
    for (const line of HERO_HEADLINE_LINES) {
      expect(code, `"${line}" is hardcoded in HeroSection`).not.toContain(line);
    }
    expect(code).not.toContain(HERO_INTRO.slice(0, 40));
    expect(src).toContain("from '../../data/heroContent.js'");
  });
});

describe('splitAround', () => {
  it('splits around the word', () => {
    expect(splitAround('go faster.', 'faster')).toEqual({
      before: 'go ',
      match: 'faster',
      after: '.',
    });
  });

  it('returns the whole string when the word is absent, dropping no copy', () => {
    const r = splitAround('no match here', 'zzz');
    expect(r).toEqual({ before: 'no match here', match: '', after: '' });
    expect(r.before + r.match + r.after).toBe('no match here');
  });
});
