/**
 * @file vite-plugin-sitemap.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Emits dist/sitemap.xml at build time, with each route's <lastmod>
 * taken from the git history of the files that render it.
 *
 * This replaces a hand-maintained public/sitemap.xml, which had gone wrong in
 * three ways at once — all of them the predictable failure of a file you have to
 * remember to edit:
 *
 *  1. `lastmod` said 2026-06-20 while the home page had changed that morning.
 *     A date that's confidently wrong is worse than none: Search Console reports
 *     it as an error, and a crawler that trusts it defers the recrawl.
 *  2. Five of the eight URLs were fragments — /#about, /#skills and friends.
 *     Google discards everything from the `#` on, so those five collapsed onto
 *     `/`, which was already listed. They were never going to index sections.
 *  3. It listed #skills but not #technologies, a section that has existed since
 *     the sections split. Nobody noticed, because nothing reads this file in CI.
 *
 * So the routes now come from one list next to the router they mirror, and the
 * dates come from git. `npm run build` can't produce a stale sitemap.
 *
 * On `lastmod` accuracy: git gives commit dates, which is what "last modified"
 * should mean for a static site — the deploy follows the merge. It's derived
 * from the *rendering sources* per route rather than the repo's HEAD date, so a
 * README typo doesn't tell Google the privacy policy changed.
 */

import { execFileSync } from 'node:child_process';

// The route list moved to src/data/routeMeta.js when each route gained a
// canonical URL and a title of its own: the sitemap and the per-route <head>
// have to agree on exactly which paths exist and how they're spelled, and two
// lists that must agree are one list. Re-exported because this module's own
// tests and importers already reach for them here.
export { ROUTES, SITE_ORIGIN } from '../src/data/routeMeta.js';
import { ROUTES, SITE_ORIGIN } from '../src/data/routeMeta.js';

const git = (args, cwd) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

/**
 * Whether git history is deep enough for per-path dates to mean anything.
 *
 * This guard is the difference between a correct sitemap and a plausible one.
 * Cloudflare Workers Builds — which is what actually deploys this site — clones
 * shallow, and in a `--depth 1` clone `git log -1 -- <path>` doesn't fail: it
 * cheerfully returns the *only* commit it has for every path. Measured on this
 * repo, /privacy went from its true 2026-07-14 to HEAD's date.
 *
 * So the deployed sitemap would have claimed all three pages changed on every
 * deploy — the exact "confidently wrong lastmod" this plugin exists to remove,
 * reintroduced with more machinery. No date beats a wrong one, so a shallow
 * clone omits <lastmod> instead.
 *
 * Which means production probably ships without dates, and that's the right
 * trade: Google only honours lastmod it judges consistently accurate, and
 * distrusts the whole file when it doesn't. To get real dates deployed, make
 * the Workers Builds build command deepen first —
 * `git fetch --unshallow || true && npm run build` — and this starts emitting
 * them with no change here. Left off by default because a build that reaches
 * the network to render a static file fails in a new way.
 */
export const hasUsableHistory = (cwd = process.cwd()) => {
  try {
    return git(['rev-parse', '--is-shallow-repository'], cwd) === 'false';
  } catch {
    return false; // not a repo, or no git binary
  }
};

/**
 * The commit date (YYYY-MM-DD) of the last change to any of `paths`, or null if
 * git can't answer it truthfully.
 *
 * Callers omit <lastmod> on null. The sitemap spec makes the element optional,
 * and Google treats a missing lastmod as "recrawl on your own schedule" — which
 * is strictly better than a date it will flag as inaccurate and then distrust
 * for the whole file.
 */
export const lastModified = (paths, cwd = process.cwd()) => {
  if (!hasUsableHistory(cwd)) return null;
  try {
    const out = git(['log', '-1', '--format=%cs', '--', ...paths], cwd);
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
  } catch {
    return null;
  }
};

/** Serialises `routes` as a urlset. */
export const renderSitemap = (routes, resolveLastmod) =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.flatMap(route => {
      const lastmod = resolveLastmod(route);
      return [
        '  <url>',
        `    <loc>${SITE_ORIGIN}${route.path}</loc>`,
        ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
        `    <changefreq>${route.changefreq}</changefreq>`,
        `    <priority>${route.priority}</priority>`,
        '  </url>',
      ];
    }),
    '</urlset>',
    '',
  ].join('\n');

export default function sitemap() {
  return {
    name: 'sitemap',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: renderSitemap(ROUTES, r => lastModified(r.sources)),
      });
    },
  };
}
