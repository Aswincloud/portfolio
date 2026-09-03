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
import { SECTION_ACCENTS } from '../data/sectionAccents.js';

/**
 * Two headline scales. Every section headline was rendering at exactly 48px/700,
 * so scrolling the page felt metronomic — six beats of identical weight with no
 * sense of where you were in the arc. `major` opens and closes the page (About,
 * Contact); the sections in between step down to `minor`, which reads as
 * body-of-the-argument rather than as another opening statement.
 *
 * Literal strings for the same reason as ACCENTS: Tailwind scans source text.
 */
const TITLE_SCALES = {
  major: 'text-4xl font-bold leading-tight sm:text-5xl',
  minor: 'text-3xl font-bold leading-tight sm:text-4xl',
};

/**
 * @param {string} number - Two-digit section index, e.g. '01'.
 * @param {string} label - Eyebrow text, matching the nav item.
 * @param {'brand'|'cyan'|'indigo'} accent - Key into SECTION_ACCENTS. Pass the
 *   same key to `sectionAccent()` on the enclosing <section> so the seam and the
 *   eyebrow agree.
 * @param {'major'|'minor'} size - Key into TITLE_SCALES.
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
  size = 'minor',
  title,
  children,
  inView,
  innerRef,
  className = 'mb-14 max-w-2xl',
}) => {
  const tone = SECTION_ACCENTS[accent] ?? SECTION_ACCENTS.brand;
  const titleClassName = TITLE_SCALES[size] ?? TITLE_SCALES.minor;

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
