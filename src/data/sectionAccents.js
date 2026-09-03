/**
 * @file sectionAccents.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description The per-section accent palette, shared by the section elements
 *   (which carry the seam + wash) and SectionHeader (which carries the eyebrow).
 *
 *   These two live on different elements — the seam is on the <section>, the
 *   eyebrow is inside it — so neither can set the other's class. Keeping the
 *   pairs in one map is what stops them drifting: About shipped with a header
 *   accent and no seam at all precisely because the two were written out by
 *   hand in separate places.
 *
 *   Not declared in SectionHeader.jsx because exporting a non-component from a
 *   component module trips react-refresh/only-export-components.
 */

/**
 * Three hues in a repeating cycle rather than six distinct ones: adjacent
 * sections need roughly 20° of hue separation to read as different colours at
 * all, and six hues spread over the emerald→violet range leaves only 12–16°
 * between neighbours. The cycle brand(156°) → cyan(187°) → indigo(230°) keeps
 * every adjacent pair ≥31° apart.
 *
 * Every value is a literal class string. Tailwind scans source text, so a class
 * built by interpolating a variable is never emitted and the accent silently
 * renders as nothing — the same constraint documented on AboutSection's `edge`
 * and `dot` fields. Reading a whole literal out of this map is fine; building
 * one from a fragment is not.
 */
export const SECTION_ACCENTS = {
  brand: {
    seam: 'section-seam seam-brand',
    label: 'text-brand-300',
    number: 'text-brand-500/70',
  },
  cyan: {
    seam: 'section-seam seam-cyan',
    label: 'text-cyan-300',
    number: 'text-cyan-500/70',
  },
  indigo: {
    seam: 'section-seam seam-indigo',
    label: 'text-indigo-300',
    number: 'text-indigo-400/70',
  },
};

/**
 * Seam + wash classes for a section shell. Pass the same accent key you give
 * that section's <SectionHeader>, so the boundary and the eyebrow can't
 * disagree.
 *
 * @param {'brand'|'cyan'|'indigo'} accent
 * @returns {string} literal class string, safe for Tailwind's source scan
 */
export const sectionAccent = accent => (SECTION_ACCENTS[accent] ?? SECTION_ACCENTS.brand).seam;
