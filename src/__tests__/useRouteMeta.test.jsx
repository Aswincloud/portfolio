/**
 * @file useRouteMeta.test.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Guards the client-side half of per-route metadata: that a SPA
 *   navigation updates <title>, canonical and the description, and that leaving
 *   the 404 puts back the canonical it removed.
 *
 *   The served HTML is already right per route (vite-plugin-route-pages.js), but
 *   a client-side navigation never fetches it — so without this hook, walking
 *   from / to /privacy leaves the tab titled "Aswin — Senior Software Engineer"
 *   and the canonical pointing at the home page.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import useRouteMeta from '../hooks/useRouteMeta.js';
import { ROUTES, NOT_FOUND_META, canonicalUrl } from '../data/routeMeta.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = relative => readFileSync(resolve(repoRoot, relative), 'utf8');

const Probe = () => {
  useRouteMeta();
  return null;
};

/** Renders the hook at `path` and returns what it did to <head>. */
const at = path => {
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path='*' element={<Probe />} />
      </Routes>
    </MemoryRouter>
  );
  const attr = (sel, name) => document.head.querySelector(sel)?.getAttribute(name) ?? null;
  const head = {
    title: document.title,
    canonical: attr('link[rel="canonical"]', 'href'),
    description: attr('meta[name="description"]', 'content'),
    ogTitle: attr('meta[property="og:title"]', 'content'),
    ogUrl: attr('meta[property="og:url"]', 'content'),
    robots: attr('meta[name="robots"]', 'content'),
    canonicalCount: document.head.querySelectorAll('link[rel="canonical"]').length,
  };
  view.unmount();
  return head;
};

beforeEach(() => {
  // Start from the served shape: one canonical, no robots meta.
  document.head.innerHTML =
    '<link rel="canonical" href="https://www.aswincloud.com/" />' +
    '<meta name="description" content="stale" />';
  document.title = 'stale';
});

describe('useRouteMeta', () => {
  it('gives each route its own title, canonical and description', () => {
    for (const route of ROUTES) {
      const head = at(route.path);
      expect(head.title, route.path).toBe(route.title);
      expect(head.canonical, route.path).toBe(canonicalUrl(route.path));
      expect(head.description, route.path).toBe(route.description);
    }
  });

  it('updates the social tags too, creating them if the document lacks them', () => {
    // The beforeEach head has no og:* at all, which is the harder case: the hook
    // has to create the tag rather than rewrite it.
    const privacy = ROUTES.find(route => route.path === '/privacy');
    const head = at('/privacy');
    expect(head.ogTitle).toBe(privacy.title);
    expect(head.ogUrl).toBe(canonicalUrl('/privacy'));
  });

  it('never leaves more than one canonical element', () => {
    // Appending instead of rewriting would give Google two conflicting
    // canonicals, which it resolves by ignoring both.
    for (const route of ROUTES) expect(at(route.path).canonicalCount, route.path).toBe(1);
  });

  it('marks an unknown path noindex and strips its canonical', () => {
    const head = at('/no-such-page');
    expect(head.title).toBe(NOT_FOUND_META.title);
    expect(head.robots).toBe('noindex, follow');
    expect(head.canonical).toBeNull();
  });

  it('restores the canonical and clears robots when navigating off the 404', () => {
    // The ordering that matters: the 404 removes the canonical, so a subsequent
    // navigation has to put one back rather than assume one is there. An earlier
    // shape of this hook only ever rewrote an existing element and would have
    // left /privacy canonical-free after a visit to a bad URL.
    at('/no-such-page');
    const head = at('/privacy');
    expect(head.canonical).toBe(canonicalUrl('/privacy'));
    expect(head.canonicalCount).toBe(1);
    expect(head.robots).toBeNull();
  });

  it('tolerates a trailing slash on a client-side link', () => {
    const privacy = ROUTES.find(route => route.path === '/privacy');
    expect(at('/privacy/').title).toBe(privacy.title);
  });

  // The failure mode this whole hook could introduce, and the one worth guarding
  // hardest: hydration must never turn a page the server served as indexable
  // into a noindex one. Anything unrecognised falls through to NOT_FOUND_META,
  // which carries `noindex` — so every spelling of a real URL has to resolve.
  //
  // Caught by Lighthouse CI, which serves staticDistDir by real filename and
  // scored /terms/index.html as "blocked from indexing" on a page whose served
  // HTML had no robots meta at all. Cloudflare 307s these to the clean path in
  // production, so no crawler lands on one — but "unreachable in production" is
  // a weaker guarantee than "cannot downgrade a page", and Google runs the JS.
  describe('never downgrades an indexable page', () => {
    const spellings = path => {
      const base = path === '/' ? '' : path;
      return [path, `${base}/`, `${base}/index.html`];
    };

    it.each(ROUTES.flatMap(route => spellings(route.path).map(url => [url, route.path])))(
      'serves %s as the metadata for %s',
      (url, routePath) => {
        const route = ROUTES.find(entry => entry.path === routePath);
        const head = at(url);
        expect(head.robots, `${url} was marked noindex`).toBeNull();
        expect(head.title, url).toBe(route.title);
        expect(head.canonical, url).toBe(canonicalUrl(routePath));
      }
    );

    it('still 404s a path that merely ends in index.html', () => {
      // The normalisation strips a `/index.html` *segment*, not a suffix — so
      // this must not be mistaken for /privacy.
      expect(at('/privacyindex.html').robots).toBe('noindex, follow');
    });
  });

  it('is actually mounted in the app, not merely exported', () => {
    // A hook nothing calls is the failure this whole file would otherwise miss:
    // every test above would still pass with the call site deleted. Asserted
    // against App.jsx rather than by rendering the app, which would pull in the
    // full section tree for one fact.
    const app = read('src/App.jsx');
    expect(app).toContain('useRouteMeta()');
    expect(app).toContain("from './hooks/useRouteMeta.js'");
  });
});
