/**
 * @file heroContent.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description The hero headline and intro, as plain strings.
 *
 *   Two things render this copy: HeroSection, and the build-time prerender that
 *   writes an <h1> into the static shell (scripts/vite-plugin-prerender-hero.js)
 *   so the page's first meaningful content is in the HTML rather than only in
 *   the bundle. They must say the same thing, and the cheap way to get that —
 *   writing the sentences out in both places — is the drift we keep paying for
 *   elsewhere in this repo. So the words live here once and both read them.
 *
 *   Keep this module free of JSX: the Vite plugin imports it directly in Node,
 *   which has no JSX loader. Emphasis is expressed as a substring to wrap, not
 *   as markup, for the same reason.
 */

/**
 * The headline, one string per visual line. HeroSection joins them with <br>;
 * the prerender joins them with a space, since the static copy has no width to
 * break against.
 */
export const HERO_HEADLINE_LINES = ['I make AI accelerators', 'go faster.'];

/** The word in the headline carrying the shimmer gradient. */
export const HERO_HEADLINE_ACCENT = 'faster';

/**
 * The role line above the headline. Lives here for the same reason the headline
 * does: HeroSection and the prerender both render it, and it was previously
 * typed out in both — the one piece of hero copy this module didn't already
 * own, and so the one that could drift.
 */
export const HERO_EYEBROW = 'Senior Software Engineer · Pondicherry, India';

export const HERO_INTRO =
  "I'm Aswin — I profile, benchmark, and optimize the software that runs on " +
  'next-generation AI silicon at MulticoreWare. Off the clock, I run my own cloud.';

/** The word in the intro rendered at a brighter weight. */
export const HERO_INTRO_EMPHASIS = 'Aswin';

/**
 * Splits `text` into the part before `word`, the word, and the part after, so a
 * caller can wrap the middle in whatever element it likes. Returns the whole
 * string as `before` when the word isn't found, which degrades to unstyled text
 * rather than dropping copy.
 *
 * @param {string} text
 * @param {string} word
 * @returns {{before: string, match: string, after: string}}
 */
export const splitAround = (text, word) => {
  const at = text.indexOf(word);
  if (at === -1) return { before: text, match: '', after: '' };
  return { before: text.slice(0, at), match: word, after: text.slice(at + word.length) };
};
