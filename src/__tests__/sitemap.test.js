/**
 * @file sitemap.test.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Guards the generated sitemap: that it lists the routes the router
 *   actually serves, that it never lists fragments, and — the case that would
 *   otherwise ship silently — that a shallow clone omits <lastmod> rather than
 *   stamping every page with HEAD's date.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { ROUTES, SITE_ORIGIN, renderSitemap } from '../../scripts/vite-plugin-sitemap.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = relative => readFileSync(resolve(repoRoot, relative), 'utf8');

const xml = renderSitemap(ROUTES, () => '2026-01-02');
const parse = s => new DOMParser().parseFromString(s, 'application/xml');
const locs = doc => [...doc.querySelectorAll('loc')].map(n => n.textContent);

describe('renderSitemap', () => {
  it('produces well-formed XML with one <url> per route', () => {
    const doc = parse(xml);
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.documentElement.tagName).toBe('urlset');
    expect(doc.querySelectorAll('url')).toHaveLength(ROUTES.length);
  });

  it('lists no fragment URLs', () => {
    // The old hand-written file had five: /#about, /#experience, /#skills,
    // /#projects, /#contact. Google discards everything from the '#', so all
    // five were duplicates of '/' — and the list had drifted anyway, missing
    // #technologies. A sitemap describes documents; this SPA has three.
    for (const loc of locs(parse(xml))) expect(loc).not.toContain('#');
  });

  it('omits <lastmod> entirely when the date is unknown', () => {
    // A shallow clone — which is how the site is actually built and deployed —
    // returns HEAD's date for every path instead of erroring. The plugin
    // detects that and passes null; this asserts null really means "leave the
    // element out" rather than emitting <lastmod></lastmod> or a bare 'null',
    // either of which is an invalid date to a crawler.
    const undated = renderSitemap(ROUTES, () => null);
    expect(undated).not.toContain('lastmod');
    expect(parse(undated).querySelector('parsererror')).toBeNull();
    expect(locs(parse(undated))).toEqual(locs(parse(xml)));
  });

  it('emits dates in W3C YYYY-MM-DD form', () => {
    for (const n of parse(xml).querySelectorAll('lastmod')) {
      expect(n.textContent).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('ROUTES', () => {
  it('covers exactly the router’s indexable paths', () => {
    // The sitemap and the <Route> list are two statements of the same fact, and
    // adding a page while forgetting the sitemap is the ordinary way this rots.
    const app = read('src/App.jsx');
    // '*' is excluded: the catch-all renders NotFound, which shouldn't be indexed.
    const declared = [...app.matchAll(/path='([^']+)'/g)].map(m => m[1]).filter(p => p !== '*');
    expect(new Set(ROUTES.map(r => r.path))).toEqual(new Set(declared));
  });

  it('dates each route from files that exist', () => {
    // A source path that's been renamed away makes git return nothing, and the
    // route quietly loses its lastmod. Cheaper to catch here than to notice in
    // Search Console.
    for (const route of ROUTES) {
      for (const src of route.sources) {
        // existsSync, not readFileSync: sources are a mix of files and
        // directories, and a directory is a perfectly good git pathspec.
        expect(existsSync(resolve(repoRoot, src)), `${route.path}: ${src}`).toBe(true);
      }
    }
  });

  it('points at the canonical origin index.html declares', () => {
    expect(read('index.html')).toContain(`<link rel="canonical" href="${SITE_ORIGIN}/"`);
  });
});
