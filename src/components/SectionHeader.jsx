/**
 * @file SectionHeader.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description The numbered eyebrow + headline that opens every content
 *   section, and the one place a section's accent hue is declared.
 *
 *   All six headers were byte-identical scaffolding repeated in full. Beyond the
 *   duplication that mattered because the page read as one slide shown six
 *   times: every section is eyebrow → headline → sub-line → bordered cards on
 *   near-black, so nothing told you where you were. The accent below is the
 *   answer — surfaces stay identical, only the hue moves.
 */

import React from 'react';
import { motion } from 'motion/react';

/**
 * Accent hues, keyed by name. Three in a repeating cycle rather than six
 * distinct ones: adjacent sections need roughly 20° of hue separation to read
 * as different colours at all, and six hues spread over the emerald→violet
 * range leaves only 12–16° between neighbours. The cycle
 * brand(156°) → cyan(187°) → indigo(230°) keeps every adjacent pair ≥31° apart.
 *
 * Every value is a literal class string. Tailwind scans source text, so a class
 * built by interpolating a variable is never emitted and the accent silently
 * renders as nothing — the same constraint documented on SkillsSection's `edge`
 * and `dot` fields.
 */
const ACCENTS = {
  brand: { seam: 'seam-brand', label: 'text-brand-300', number: 'text-brand-500/70' },
  cyan: { seam: 'seam-cyan', label: 'text-cyan-300', number: 'text-cyan-500/70' },
  indigo: { seam: 'seam-indigo', label: 'text-indigo-300', number: 'text-indigo-400/70' },
};

/**
 * @param {string} number - Two-digit section index, e.g. '01'.
 * @param {string} label - Eyebrow text, matching the nav item.
 * @param {'brand'|'cyan'|'indigo'} accent - Key into ACCENTS.
 * @param {React.ReactNode} title - Headline content (may contain a
 *   `gradient-text` span).
 * @param {React.ReactNode} children - Optional sub-copy under the headline.
 * @param {boolean} inView - Drives the entrance animation.
 * @param {React.Ref} innerRef - Forwarded to the wrapper when the section uses
 *   this element as its own useInView target.
 */
const SectionHeader = ({
  number,
  label,
  accent = 'brand',
  title,
  titleClassName = 'text-4xl font-bold sm:text-5xl',
  children,
  inView,
  innerRef,
  className = 'mb-14 max-w-2xl',
}) => {
  const tone = ACCENTS[accent] ?? ACCENTS.brand;

  return (
    <motion.div
      ref={innerRef}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7 }}
      className={className}
    >
      <p className={`eyebrow mb-5 ${tone.label}`}>
        <span className={tone.number}>{number} /</span> {label}
      </p>
      <h2 className={titleClassName}>{title}</h2>
      {children}
    </motion.div>
  );
};

export default SectionHeader;
