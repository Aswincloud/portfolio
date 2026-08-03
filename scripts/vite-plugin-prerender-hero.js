/**
 * @file vite-plugin-prerender-hero.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Writes the hero's <h1> and intro paragraph into `<div id="root">`
 * at build time, so the served HTML contains the page's first meaningful content
 * instead of an empty shell.
 *
 * Why this exists: the site is a client-rendered SPA, so the 8 KB shell had no
 * <h1> at all — the headline was created by React after the bundle parsed.
 * Lighthouse executes JS and scored SEO 100 regardless, which is exactly what
 * made this easy to miss. Crawlers and link unfurlers that don't run JS saw
 * nothing but <div id="root"></div>.
 *
 * Why not render the real component with renderToStaticMarkup: HeroSection's
 * entrance animation means every motion element serialises with
 * `style="opacity:0"` — ten of them. That publishes the headline as invisible
 * text, which is worse than publishing none: it reads as cloaking, and a reader
 * with JS disabled sees a blank page either way. Stripping the inline styles
 * back out afterwards would leave the build depending on the exact shape of
 * motion's SSR output. So this emits its own small, static markup, and the
 * words come from src/data/heroContent.js, which HeroSection also reads — there
 * is one copy of the sentences, not two. That was true of the headline and
 * intro but not the role line, which was typed out here and in HeroSection
 * until a title change had to be made in both; it now comes from the module
 * with the rest.
 *
 * React's createRoot() clears the container before its first render, so this
 * markup is replaced wholesale on mount. It is never hydrated and never has to
 * match what React produces, which is what keeps it free to be simpler than the
 * real hero.
 *
 * Ordering note: this runs in `transformIndexHtml` so the injected markup is
 * part of the HTML that vite-plugin-security-headers hashes at closeBundle. The
 * two don't actually interact today — this adds no <script> and no inline event
 * handler, so it contributes no hashes — but if that ever changes, the CSP is
 * derived from the final file and stays correct by construction.
 */

import {
  HERO_HEADLINE_LINES,
  HERO_HEADLINE_ACCENT,
  HERO_EYEBROW,
  HERO_INTRO,
  HERO_INTRO_EMPHASIS,
  splitAround,
} from '../src/data/heroContent.js';

/** Minimal HTML-escape for text interpolated into the shell. */
const esc = s =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * The static hero. Deliberately plain: no Tailwind utilities, because this is
 * replaced within a frame of the bundle executing and styling it would mean a
 * second copy of the hero's design to keep in step. The inline styles below
 * exist only so the pre-paint frame is dark-on-dark rather than a flash of
 * black serif text on the #060a13 background painted by the shell's <style>.
 */
export function renderHeroShell() {
  const headline = HERO_HEADLINE_LINES.join(' ');
  const h = splitAround(headline, HERO_HEADLINE_ACCENT);
  const p = splitAround(HERO_INTRO, HERO_INTRO_EMPHASIS);

  const headlineHtml = h.match
    ? `${esc(h.before)}<span style="color:#34d399">${esc(h.match)}</span>${esc(h.after)}`
    : esc(h.before);
  const introHtml = p.match
    ? `${esc(p.before)}<strong style="color:#e2e8f0;font-weight:600">${esc(p.match)}</strong>${esc(p.after)}`
    : esc(p.before);

  return (
    `<div id="hero-shell" style="max-width:56rem;margin:0 auto;padding:8rem 1.5rem 0;text-align:center;color:#94a3b8;font-family:system-ui,sans-serif">` +
    `<p style="font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;color:#34d399">${esc(HERO_EYEBROW)}</p>` +
    `<h1 style="margin:1.25rem 0 0;font-size:2.25rem;line-height:1.05;font-weight:700;color:#fff">${headlineHtml}</h1>` +
    `<p style="margin:1rem auto 0;max-width:42rem;line-height:1.625">${introHtml}</p>` +
    `</div>`
  );
}

export default function prerenderHero() {
  return {
    name: 'prerender-hero',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const root = '<div id="root"></div>';
        if (!html.includes(root)) {
          // Loud rather than silent: a renamed or reformatted root element would
          // otherwise drop the prerender and leave the shell empty again, with
          // nothing in CI to notice — the same failure mode this plugin fixes.
          throw new Error(
            `[prerender-hero] could not find \`${root}\` in index.html; the hero was not injected.`
          );
        }
        return html.replace(root, `<div id="root">${renderHeroShell()}</div>`);
      },
    },
  };
}
