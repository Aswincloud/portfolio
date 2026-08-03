/**
 * @file useRouteMeta.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Keeps the live document's title, canonical URL and description in
 *   step with the current route.
 *
 *   This is the client-side half of a pair. The served HTML is already correct
 *   per route — scripts/vite-plugin-route-pages.js emits a real document for
 *   each one, which is what crawlers and unfurlers read. But a client-side
 *   navigation from / to /privacy never fetches that document, so without this
 *   the tab title, the canonical and the description would all still describe
 *   whichever page the visitor happened to land on first.
 *
 *   That matters beyond tidiness: browser history entries and bookmarks take
 *   the title at navigation time, and Google's renderer does read the
 *   post-hydration DOM. The served bytes are the strong signal; this stops the
 *   weak one from contradicting them.
 *
 *   Deliberately not a <Helmet>-style library. Three tags on route change is a
 *   `useEffect`, and the alternative is a dependency plus a provider in the tree
 *   for something the platform does in ten lines.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { metaForPath, canonicalUrl } from '../data/routeMeta.js';

/**
 * Set (or create) a `<meta name|property="key">`'s content.
 *
 * Creates when missing rather than bailing out: index.html ships every key this
 * is called with, but the 404 document has no canonical at all by design, and a
 * client-side navigation *away* from it has to be able to put one back.
 */
const setMeta = (attr, key, content) => {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

/** Point `<link rel="canonical">` at `url`, or remove it when url is null. */
const setCanonical = url => {
  const existing = document.head.querySelector('link[rel="canonical"]');
  if (url === null) {
    existing?.remove();
    return;
  }
  if (existing) {
    existing.setAttribute('href', url);
    return;
  }
  const link = document.createElement('link');
  link.setAttribute('rel', 'canonical');
  link.setAttribute('href', url);
  document.head.appendChild(link);
};

/** Add or remove `<meta name="robots" content="noindex, follow">`. */
const setRobots = noindex => {
  const existing = document.head.querySelector('meta[name="robots"]');
  if (!noindex) {
    existing?.remove();
    return;
  }
  if (!existing) setMeta('name', 'robots', 'noindex, follow');
};

/**
 * Syncs <head> to the active route. Mount once, near the router root.
 */
export default function useRouteMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = metaForPath(pathname);

    document.title = meta.title;
    setMeta('name', 'description', meta.description);
    setMeta('property', 'og:title', meta.title);
    setMeta('property', 'og:description', meta.description);
    setMeta('name', 'twitter:title', meta.title);
    setMeta('name', 'twitter:description', meta.description);

    // A noindex page shouldn't also name a canonical — the two instructions
    // contradict each other. Same rule the build applies to 404.html.
    setCanonical(meta.noindex ? null : canonicalUrl(meta.path));

    // og:url follows the page even when the canonical is dropped, because the
    // two tags answer different questions: the canonical says "index this URL
    // instead", which is why a noindex page must not name one, while og:url
    // says "this is the page you are looking at" to an unfurler that does not
    // consult robots at all. Sending the home page's URL there would make a
    // pasted broken link render as the portfolio's own card.
    //
    // It also has to match what 404.html actually ships: the build writes
    // og:url = /404 (NOT_FOUND_META.path), so a client-rendered 404 pointing at
    // '/' would make the two halves of this pair disagree on the same route.
    const socialUrl = canonicalUrl(meta.path);
    setMeta('property', 'og:url', socialUrl);
    setMeta('name', 'twitter:url', socialUrl);
    setRobots(Boolean(meta.noindex));
  }, [pathname]);
}
