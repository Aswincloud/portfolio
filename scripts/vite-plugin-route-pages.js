/**
 * @file vite-plugin-route-pages.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Emits one real HTML document per route — dist/privacy/index.html,
 * dist/terms/index.html, dist/404.html — each with its own canonical URL, title,
 * description and social tags, derived from the shipped index.html.
 *
 * Why this exists: index.html carried a single hardcoded
 * `<link rel="canonical" href="https://www.aswincloud.com/">` and a single
 * <title>, and nothing in the app ever changed them. Every route served the
 * same head. That is not a cosmetic problem — /privacy and /terms were telling
 * Google "the canonical version of this page is the home page", i.e. drop me,
 * at the same time as sitemap.xml was listing them as documents worth indexing.
 * Canonical is the stronger signal, so the sitemap achieved nothing for them.
 *
 * Why build-time documents rather than setting the tags from React: Google
 * renders JavaScript, but a canonical that only exists after hydration is
 * materially weaker than one in the served bytes, and every non-Google crawler
 * and every link unfurler reads the HTML as delivered. useRouteMeta.js does
 * maintain the live document for client-side navigation — that is the other
 * half of this, not a substitute for it.
 *
 * How: the built index.html is already the finished shell (bundle tags,
 * modulepreloads, prerendered hero), so each route page is that file with its
 * head rewritten, rather than a second template to keep in step. Get this wrong
 * and the subpages silently miss a preload; deriving them means they can't.
 *
 * Ordering: `closeBundle`, without `enforce`, so this runs after Vite has
 * written dist/index.html and before vite-plugin-security-headers (which is
 * `enforce: 'post'`) reads it back. Verified against the real build — the
 * ordering matters because the CSP is hashed from index.html and these pages
 * must not introduce a script it doesn't cover. They can't: every rewrite below
 * is inside <head> metadata, and the assertion in routePages.test.js pins the
 * emitted pages to the same inline-script set as index.html.
 *
 * Routing: wrangler.toml pairs this with `html_handling = "drop-trailing-slash"`
 * (so /privacy serves privacy/index.html without a redirect to /privacy/) and
 * `not_found_handling = "404-page"` (so an unknown path gets a genuine 404
 * carrying 404.html, instead of 200 with the home page). Both were verified
 * against `wrangler dev`; see the test for the URL contract they produce.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ROUTES, NOT_FOUND_META, canonicalUrl } from '../src/data/routeMeta.js';
import { renderHeroShell } from './vite-plugin-prerender-hero.js';

/** Minimal HTML-escape for text interpolated into an attribute or element. */
const esc = s =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Replace the content="" of a `<meta name|property="key" …>`, or drop it.
 *
 * Written as a matcher over the whole tag rather than a search for `content="`
 * because the attributes appear in both orders in index.html and Prettier
 * reflows long ones across lines — `[\s\S]` and the unanchored attribute scan
 * are what make it survive both. A tag that isn't present is left alone rather
 * than appended: every key this is called with already exists in index.html,
 * and silently inventing one would hide a rename.
 */
export const setMeta = (html, key, value) => {
  const tag = new RegExp(`<meta\\s[^>]*?(?:name|property)="${key}"[^>]*?>`, 'i');
  return html.replace(tag, match => {
    if (value === null) return '';
    // Replacements go through a function, never a string: `$&`, `$1` and friends
    // are substitution syntax in a string replacement, so a description
    // containing one would be silently corrupted.
    const attr = `content="${esc(value)}"`;
    const withContent = match.replace(/content="[\s\S]*?"/i, () => attr);
    // A tag with no content attribute at all leaves the replace above a no-op,
    // which would publish the old value silently. Add the attribute instead.
    return withContent === match ? match.replace(/\s*\/?>$/, () => ` ${attr} />`) : withContent;
  });
};

/**
 * Replace the href of the canonical link.
 *
 * Matched over the whole tag because index.html writes `rel` before `href` and
 * Prettier is free to reflow it. Like setMeta, the replacement is a function:
 * a `$&` reaching String.replace as a string re-inserts the matched tag.
 */
export const setCanonical = (html, url) =>
  html.replace(
    /<link\s[^>]*?rel="canonical"[^>]*?>/i,
    () => `<link rel="canonical" href="${esc(url)}" />`
  );

/** Replace the document title. */
export const setTitle = (html, title) =>
  html.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${esc(title)}</title>`);

/**
 * Rewrite the shell's head for one route.
 *
 * og:image and twitter:image are deliberately left pointing at the single site
 * card — there is one, and generate-og-image.mjs is why. og:title/description
 * do move, because those are text and cost nothing to be honest about.
 */
export const renderRoutePage = (shell, meta) => {
  const url = canonicalUrl(meta.path);
  let html = setTitle(shell, meta.title);
  html = setCanonical(html, url);
  html = setMeta(html, 'description', meta.description);
  html = setMeta(html, 'og:url', url);
  html = setMeta(html, 'og:title', meta.title);
  html = setMeta(html, 'og:description', meta.description);
  html = setMeta(html, 'twitter:url', url);
  html = setMeta(html, 'twitter:title', meta.title);
  html = setMeta(html, 'twitter:description', meta.description);

  if (meta.noindex) {
    // The 404 already carries a 404 status, which is the strongest signal there
    // is. This covers the crawlers that have the body in hand anyway, and it
    // costs one tag. Injected before </head> because index.html has no robots
    // meta to rewrite — the home page wants the default (index, follow) and
    // stating it would just be noise.
    html = html.replace('</head>', '  <meta name="robots" content="noindex, follow" />\n  </head>');
    // A noindex page has no business advertising a canonical: the two
    // instructions contradict each other, and Google's guidance is not to
    // combine them.
    html = html.replace(/\s*<link\s[^>]*?rel="canonical"[^>]*?>/i, '');
  }

  return html;
};

/**
 * Replace the prerendered hero with the subpage's own <h1>.
 *
 * Without this, dist/privacy/index.html would serve "I make AI accelerators go
 * faster." as its first heading — the shell it is derived from has the hero
 * baked in. That's the cloaking-shaped failure the prerender plugin's own
 * header warns about: a document whose visible heading and its served heading
 * disagree. React replaces the container on mount either way (createRoot clears
 * it), so this only has to be true of the served bytes.
 */
export const setPrerenderedHeading = (html, heading) => {
  // Exact string swap against the markup the hero plugin emitted, not a regex
  // guess at its shape: both modules import renderHeroShell, so the needle is
  // the same bytes by construction. If the hero markup ever changes, this keeps
  // matching; if the *injection* stops happening, the throw below fires rather
  // than a subpage quietly shipping the hero headline as its <h1>.
  const hero = renderHeroShell();
  if (!html.includes(hero)) {
    throw new Error(
      '[route-pages] the prerendered hero was not found in the built index.html, ' +
        'so the subpage heading could not be substituted.'
    );
  }
  // Replacement as a function, not a string: a heading containing `$&` would
  // otherwise re-insert the entire matched hero markup into the <h1>. Verified —
  // this bit once, with the whole hero nested inside the heading.
  return html.replace(
    hero,
    () =>
      `<div id="page-shell" style="max-width:48rem;margin:0 auto;padding:8rem 1.5rem 0;color:#94a3b8;font-family:system-ui,sans-serif">` +
      `<h1 style="margin:0;font-size:1.875rem;font-weight:700;color:#fff">${esc(heading)}</h1>` +
      `</div>`
  );
};

/** Every non-home document this plugin writes: [output path, metadata]. */
export const outputs = () => [
  ...ROUTES.filter(route => route.path !== '/').map(route => [
    `${route.path.replace(/^\//, '')}/index.html`,
    route,
  ]),
  ['404.html', NOT_FOUND_META],
];

export default function routePages() {
  let outDir = 'dist';
  return {
    name: 'route-pages',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
    },
    closeBundle() {
      const shellPath = join(outDir, 'index.html');
      const shell = readFileSync(shellPath, 'utf8');

      // The home page's own head is right in index.html already, but it is
      // written by hand there and this is the module that knows what it should
      // say. Rewriting it from ROUTES makes index.html's <title> and the list
      // one fact rather than two — and if they ever disagree, ROUTES wins.
      const home = ROUTES.find(route => route.path === '/');
      writeFileSync(shellPath, renderRoutePage(shell, home), 'utf8');

      for (const [file, meta] of outputs()) {
        let html = renderRoutePage(shell, meta);
        if (meta.heading) html = setPrerenderedHeading(html, meta.heading);
        const dest = join(outDir, file);
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, html, 'utf8');
      }
    },
  };
}
