/**
 * @file routePages.test.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Guards the per-route <head>: that every route publishes its own
 *   canonical URL and title, that the 404 is noindex and canonical-free, and
 *   that the whole thing agrees with the router, the sitemap and wrangler.toml.
 *
 *   The bug this exists for: index.html carried one hardcoded canonical (`/`)
 *   and one <title>, and nothing ever changed them — so /privacy told Google
 *   "I am really the home page, drop me" while sitemap.xml was listing it as
 *   worth indexing, and the two changes cancelled out. Nothing in CI noticed,
 *   because every individual file was internally consistent.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  renderRoutePage,
  setPrerenderedHeading,
  setMeta,
  setTitle,
  setCanonical,
  outputs,
} from '../../scripts/vite-plugin-route-pages.js';
import { renderHeroShell } from '../../scripts/vite-plugin-prerender-hero.js';
import { collectInlineScriptHashes } from '../../scripts/vite-plugin-security-headers.js';
import {
  ROUTES,
  NOT_FOUND_META,
  SITE_ORIGIN,
  canonicalUrl,
  metaForPath,
} from '../data/routeMeta.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = relative => readFileSync(resolve(repoRoot, relative), 'utf8');

const parse = html => new DOMParser().parseFromString(html, 'text/html');
/** The shell the plugin really operates on: index.html with the hero injected. */
const shell = () =>
  read('index.html').replace('<div id="root">', `<div id="root">${renderHeroShell()}`);

const headOf = html => {
  const doc = parse(html);
  const attr = (sel, name) => doc.querySelector(sel)?.getAttribute(name) ?? null;
  return {
    title: doc.querySelector('title')?.textContent ?? null,
    canonical: attr('link[rel="canonical"]', 'href'),
    description: attr('meta[name="description"]', 'content'),
    ogUrl: attr('meta[property="og:url"]', 'content'),
    ogTitle: attr('meta[property="og:title"]', 'content'),
    ogDescription: attr('meta[property="og:description"]', 'content'),
    twitterTitle: attr('meta[name="twitter:title"]', 'content'),
    robots: attr('meta[name="robots"]', 'content'),
    h1: doc.querySelector('h1')?.textContent ?? null,
  };
};

describe('renderRoutePage', () => {
  it('gives every indexable route its own canonical URL', () => {
    // The whole point. Before this, all three were https://www.aswincloud.com/.
    const canonicals = ROUTES.map(route => headOf(renderRoutePage(shell(), route)).canonical);
    expect(canonicals).toEqual(ROUTES.map(route => canonicalUrl(route.path)));
    // Distinct, not merely present — a bug that pointed them all at '/' again
    // would satisfy a "canonical exists" assertion.
    expect(new Set(canonicals).size).toBe(ROUTES.length);
  });

  it('gives every route its own title and description', () => {
    const titles = ROUTES.map(route => headOf(renderRoutePage(shell(), route)).title);
    expect(titles).toEqual(ROUTES.map(route => route.title));
    expect(new Set(titles).size).toBe(ROUTES.length);

    const descriptions = ROUTES.map(r => headOf(renderRoutePage(shell(), r)).description);
    expect(new Set(descriptions).size).toBe(ROUTES.length);
  });

  it('moves the social tags with the page, not just the canonical', () => {
    // og:url pointing at '/' from /privacy is the same duplicate-signal bug in
    // a different tag, and it's the one a link unfurl actually shows.
    const privacy = ROUTES.find(route => route.path === '/privacy');
    const head = headOf(renderRoutePage(shell(), privacy));
    expect(head.ogUrl).toBe(canonicalUrl('/privacy'));
    expect(head.ogTitle).toBe(privacy.title);
    expect(head.ogDescription).toBe(privacy.description);
    expect(head.twitterTitle).toBe(privacy.title);
  });

  it('marks the 404 noindex and gives it no canonical', () => {
    const head = headOf(renderRoutePage(shell(), NOT_FOUND_META));
    expect(head.robots).toBe('noindex, follow');
    // noindex plus canonical is a contradiction; Google's guidance is not to
    // combine them, so the canonical must be gone rather than merely different.
    expect(head.canonical).toBeNull();
  });

  it('leaves indexable pages with no robots meta at all', () => {
    // Absent means "index, follow". Stating it would be noise — but a bug that
    // leaked the 404's noindex onto a real page would deindex the site, so this
    // is worth pinning.
    for (const route of ROUTES) {
      expect(headOf(renderRoutePage(shell(), route)).robots, route.path).toBeNull();
    }
  });

  it('changes only the head — the bundle tags and preloads survive', () => {
    // The pages are derived from the built shell precisely so they can't miss a
    // modulepreload. If a rewrite ever ate one, the subpage would still work but
    // load measurably worse, and nothing else would notice.
    const before = shell();
    const after = renderRoutePage(
      before,
      ROUTES.find(r => r.path === '/privacy')
    );
    const tags = html =>
      [...parse(html).querySelectorAll('script[src], link[rel="modulepreload"]')].map(
        el => el.getAttribute('src') ?? el.getAttribute('href')
      );
    expect(tags(after)).toEqual(tags(before));
    expect(tags(after).length).toBeGreaterThan(0); // else the equality proves nothing
  });

  it('introduces no inline script, so the CSP hashed from index.html still covers it', () => {
    // _headers is generated from index.html alone, but it applies to /* — so a
    // subpage carrying a script index.html doesn't have would be blocked in the
    // browser with nothing failing at build time.
    const base = collectInlineScriptHashes(shell());
    for (const [file, meta] of outputs()) {
      const html = renderRoutePage(shell(), meta);
      expect(collectInlineScriptHashes(html), file).toEqual(base);
    }
  });
});

describe('setPrerenderedHeading', () => {
  it('replaces the hero headline with the page’s own h1', () => {
    // Without this, /privacy would serve "I make AI accelerators go faster." as
    // its first heading — visible-vs-served disagreement, which is the
    // cloaking-shaped failure the prerender plugin's header warns about.
    const html = setPrerenderedHeading(renderRoutePage(shell(), NOT_FOUND_META), '404');
    const doc = parse(html);
    const h1s = [...doc.querySelectorAll('h1')];
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe('404');
    expect(doc.querySelector('#hero-shell')).toBeNull();
  });

  it('escapes the heading rather than interpolating it raw', () => {
    const html = setPrerenderedHeading(shell(), 'Terms & <script>x</script>');
    // Parsed, not regexed: what matters is the element set a browser builds.
    const built = [...parse(html).querySelectorAll('#page-shell *')].map(el => el.tagName);
    expect(built).toEqual(['H1']);
    expect(parse(html).querySelector('#page-shell h1').textContent).toBe(
      'Terms & <script>x</script>'
    );
  });

  it('throws if the hero markup is missing, rather than shipping the wrong h1', () => {
    expect(() => setPrerenderedHeading('<div id="root"></div>', 'X')).toThrow(
      /hero was not found/i
    );
  });
});

describe('$-substitution safety', () => {
  // Every rewriter here is a String.replace, and in a *string* replacement `$&`
  // means "the whole match" and `$1` means "group 1". So copy containing a `$&`
  // silently re-injects the markup being replaced. This is not hypothetical: it
  // bit setTitle, setCanonical and setPrerenderedHeading during this change, and
  // the last one nested the entire hero — headline, intro and all — inside the
  // subpage's <h1>. The escaping test above did not catch it, because `$` needs
  // no escaping to be dangerous. Hence a case per rewriter.
  const evil = 'A $& B $1 C $$';

  it('setTitle keeps the title to the literal text', () => {
    expect(parse(setTitle('<title>old</title>', evil)).querySelector('title').textContent).toBe(
      evil
    );
  });

  it('setMeta keeps the content to the literal text', () => {
    const out = setMeta('<meta name="description" content="x" />', 'description', evil);
    expect(parse(out).querySelector('meta').getAttribute('content')).toBe(evil);
  });

  it('setCanonical keeps the href to the literal URL', () => {
    const out = setCanonical('<link rel="canonical" href="a" />', 'https://x/$&y');
    expect(parse(out).querySelector('link[rel="canonical"]').getAttribute('href')).toBe(
      'https://x/$&y'
    );
  });

  it('setPrerenderedHeading does not re-inject the hero into the h1', () => {
    const html = setPrerenderedHeading(shell(), evil);
    const doc = parse(html);
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('h1').textContent).toBe(evil);
    // The specific failure: the hero markup reappearing inside the heading.
    expect(doc.querySelector('#page-shell #hero-shell')).toBeNull();
  });
});

describe('head rewriters', () => {
  it('setTitle escapes and replaces, keeping one title element', () => {
    const out = setTitle('<head><title>old</title></head>', 'a & b');
    expect(parse(out).querySelectorAll('title')).toHaveLength(1);
    expect(parse(out).querySelector('title').textContent).toBe('a & b');
  });

  it('setCanonical rewrites href regardless of attribute order', () => {
    // index.html writes rel before href; Prettier is free to reflow either.
    const forms = [
      '<link rel="canonical" href="https://x/" />',
      '<link href="https://x/" rel="canonical" />',
    ];
    for (const form of forms) {
      const out = setCanonical(form, 'https://y/z');
      expect(parse(out).querySelector('link[rel="canonical"]').getAttribute('href')).toBe(
        'https://y/z'
      );
    }
  });

  it('setMeta handles both name= and property=, and multi-line tags', () => {
    // Prettier wraps long meta tags across lines, and a pattern that can't
    // cross a newline would silently leave the old content in place.
    const html = `<meta\n  name="description"\n  content="old text"\n/>`;
    expect(
      parse(setMeta(html, 'description', 'new'))
        .querySelector('meta')
        .getAttribute('content')
    ).toBe('new');
    const og = '<meta property="og:title" content="old" />';
    expect(
      parse(setMeta(og, 'og:title', 'new'))
        .querySelector('meta')
        .getAttribute('content')
    ).toBe('new');
  });

  it('setMeta escapes quotes so it cannot break out of the attribute', () => {
    const out = setMeta('<meta name="description" content="x" />', 'description', 'a"b');
    expect(parse(out).querySelector('meta').getAttribute('content')).toBe('a"b');
  });
});

describe('the emitted file set', () => {
  it('writes one document per non-home route, plus 404.html', () => {
    expect(outputs().map(([file]) => file)).toEqual([
      'privacy/index.html',
      'terms/index.html',
      '404.html',
    ]);
  });

  it('uses directory-index paths, which is what drop-trailing-slash serves', () => {
    // privacy/index.html + html_handling="drop-trailing-slash" serves /privacy
    // with no redirect. privacy.html would serve /privacy too, but the default
    // auto-trailing-slash would then 307 /privacy -> /privacy/, changing the
    // URL out from under the canonical. Verified against `wrangler dev`.
    for (const [file, meta] of outputs()) {
      if (meta === NOT_FOUND_META) continue;
      expect(file).toBe(`${meta.path.replace(/^\//, '')}/index.html`);
    }
  });
});

describe('agreement with everything else that names a route', () => {
  it('covers exactly the router’s indexable paths', () => {
    const app = read('src/App.jsx');
    // '*' is excluded: the catch-all renders NotFound, which is 404.html's job.
    const declared = [...app.matchAll(/path='([^']+)'/g)].map(m => m[1]).filter(p => p !== '*');
    expect(new Set(ROUTES.map(route => route.path))).toEqual(new Set(declared));
  });

  it('is the same list the sitemap emits, imported not copied', () => {
    // These were two hand-maintained lists for one build. If they ever diverge
    // again, the sitemap starts advertising URLs whose canonical disagrees.
    const sitemapSrc = read('scripts/vite-plugin-sitemap.js');
    expect(sitemapSrc).toContain("from '../src/data/routeMeta.js'");
    expect(sitemapSrc).not.toMatch(/^export const ROUTES = \[/m);
  });

  it('pairs with the wrangler config that actually serves these files', () => {
    const wrangler = read('wrangler.toml');
    // Without 404-page, an unknown path returns the home page at HTTP 200 and
    // every typo'd URL is an indexable soft-404.
    expect(wrangler).toMatch(/not_found_handling\s*=\s*"404-page"/);
    // Without drop-trailing-slash, /privacy 307s to /privacy/ and the canonical
    // published above points at a URL that redirects.
    expect(wrangler).toMatch(/html_handling\s*=\s*"drop-trailing-slash"/);
  });

  it('publishes the same origin index.html declares', () => {
    expect(read('index.html')).toContain(`<link rel="canonical" href="${SITE_ORIGIN}/"`);
  });
});

describe('metaForPath', () => {
  it('resolves each route', () => {
    for (const route of ROUTES) expect(metaForPath(route.path)).toBe(route);
  });

  it('tolerates a trailing slash', () => {
    // Cloudflare redirects these away, but client-side navigation never reaches
    // Cloudflare — a <Link to='/privacy/'> would otherwise get 404 metadata on
    // a page plainly rendering the privacy policy.
    expect(metaForPath('/privacy/')).toBe(metaForPath('/privacy'));
    expect(metaForPath('/')).toBe(ROUTES.find(route => route.path === '/'));
  });

  it('falls back to the 404 metadata for unknown paths', () => {
    expect(metaForPath('/nope')).toBe(NOT_FOUND_META);
    expect(NOT_FOUND_META.noindex).toBe(true);
  });
});
