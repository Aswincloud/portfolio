/**
 * @file routeMeta.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Per-route <head> metadata — canonical URL, title, description —
 *   for every page the router serves.
 *
 *   Why this exists: index.html hardcoded one canonical (`/`) and one title, and
 *   nothing ever changed them. So /privacy and /terms each told Google "I am
 *   actually the home page, drop me" — while sitemap.xml was simultaneously
 *   listing them as documents worth indexing. Canonical wins that argument, so
 *   the sitemap did nothing for those two pages. Same story for the title:
 *   /privacy was published as "Aswin — Senior Software Engineer".
 *
 *   Four things now read this one list:
 *     - scripts/vite-plugin-prerender-hero.js, which emits a real HTML document
 *       per route at build time with these values baked into the served markup
 *     - scripts/vite-plugin-sitemap.js, so the sitemap can't list a route that
 *       has no page or omit one that does
 *     - src/hooks/useRouteMeta.js, which keeps the live document in step across
 *       client-side navigations (the served HTML is only correct on first load)
 *     - src/__tests__/routeMeta.test.js
 *
 *   Keep this module free of JSX and of any src/ import that pulls in React:
 *   the Vite plugins import it directly in Node, which has no JSX loader.
 */

/** Origin for every absolute URL the site publishes. No trailing slash. */
export const SITE_ORIGIN = 'https://www.aswincloud.com';

/**
 * The site-wide social image. Per-route og:image would be better, but there is
 * one card and pretending otherwise means shipping a promise the PNG doesn't
 * keep — see scripts/generate-og-image.mjs for why that file is generated.
 */
export const OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

/**
 * Every indexable route, mirroring the <Route> list in src/App.jsx.
 *
 * `path` is the URL with no trailing slash ('/' excepted), which is the form
 * wrangler.toml's `html_handling = "drop-trailing-slash"` redirects to and the
 * form the canonical and the sitemap both publish. One spelling per page.
 *
 * `sources` are the paths whose git history dates the route in the sitemap.
 * Keep them narrow: they're the difference between a meaningful lastmod and
 * HEAD's date wearing a costume.
 */
export const ROUTES = [
  {
    path: '/',
    title: 'Aswin — Senior Software Engineer',
    description:
      'Aswin is a senior software engineer in Pondicherry, India, optimizing the software that runs on AI accelerator hardware — profiling, benchmarking, and squeezing throughput out of specialized silicon. Also builds fast, modern websites and self-hosted cloud infrastructure.',
    // The home page's <h1> is the hero headline, which is prerendered from
    // heroContent.js rather than named here — there is one copy of it.
    changefreq: 'weekly',
    priority: '1.0',
    sources: [
      'index.html',
      'src/App.jsx',
      'src/data',
      'src/components/sections',
      'src/components/background',
    ],
  },
  {
    path: '/privacy',
    title: 'Privacy Policy — Aswin',
    description:
      'How aswincloud.com handles personal data: what the contact form collects, the analytics and support tools in use, how long anything is kept, and how to request deletion.',
    heading: 'Privacy Policy',
    changefreq: 'yearly',
    priority: '0.3',
    sources: ['src/components/PrivacyPolicy.jsx'],
  },
  {
    path: '/terms',
    title: 'Terms & Conditions — Aswin',
    description:
      'Terms of use for aswincloud.com: acceptable use, intellectual property in the site and its source, disclaimers, and limitation of liability.',
    heading: 'Terms & Conditions',
    changefreq: 'yearly',
    priority: '0.3',
    sources: ['src/components/TermsConditions.jsx'],
  },
];

/**
 * The 404. Deliberately not in ROUTES: it is a real page with real metadata,
 * but it must never be sitemapped and must never be indexed, and keeping it out
 * of the indexable list is what makes both of those true by construction rather
 * than by remembering.
 *
 * `noindex` is the load-bearing field. Cloudflare serves this document with a
 * genuine 404 status (wrangler.toml: `not_found_handling = "404-page"`), which
 * is the strongest possible signal on its own — but a crawler that has already
 * fetched the body, and every crawler that treats status loosely, reads the
 * robots meta. Both cost nothing, and soft-404s are the classic way a site ends
 * up with hundreds of indexed junk URLs.
 */
export const NOT_FOUND_META = {
  path: '/404',
  title: 'Page Not Found — Aswin',
  description: 'That page does not exist. Head back to the home page.',
  heading: '404',
  noindex: true,
};

/** Absolute canonical URL for a route path. */
export const canonicalUrl = path => `${SITE_ORIGIN}${path === '/' ? '/' : path}`;

/**
 * The metadata for a pathname, or NOT_FOUND_META when nothing matches.
 *
 * Both spellings this normalises away are ones Cloudflare redirects at the edge,
 * so neither reaches a browser in production. They still have to be handled
 * here, because falling through to NOT_FOUND_META does not merely mislabel the
 * page — it applies `noindex` to a document the server served as indexable, and
 * Google executes JavaScript. The hook must never be able to downgrade a page.
 *
 *   - Trailing slash: client-side navigation never touches the edge, so a
 *     <Link to='/privacy/'> would otherwise get the 404 metadata on a page
 *     plainly rendering the privacy policy.
 *   - `/index.html`: the directory index requested by its real filename. Any
 *     static file server does this — Lighthouse CI's `staticDistDir` mode is
 *     how it was caught, serving /terms/index.html and scoring the hydrated
 *     result as "blocked from indexing".
 */
export const metaForPath = pathname => {
  const normalized = pathname
    .replace(/\/index\.html$/i, '/')
    .replace(/(.)\/$/, (_match, preceding) => preceding);
  return ROUTES.find(route => route.path === normalized) ?? NOT_FOUND_META;
};
