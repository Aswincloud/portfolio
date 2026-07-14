/**
 * @file useCountUp.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Animate a numeric value from 0 up to its target once, when the
 *   caller signals the element is in view. Preserves any non-numeric prefix or
 *   suffix around the number (e.g. "3+ years" counts the 3, keeps "+ years";
 *   "10+" counts the 10, keeps "+"). Honors prefers-reduced-motion by showing
 *   the final value immediately.
 */

import { useEffect, useRef, useState } from 'react';

// Split a display value like "10+", "3+ years", or "—" into a numeric target
// and the surrounding text so we can rebuild the string as the number climbs.
const parse = value => {
  const str = String(value);
  const match = str.match(/\d[\d,]*/); // first run of digits (commas tolerated)
  if (!match) return null; // e.g. "—" or "Less than a month" — nothing to count
  const target = parseInt(match[0].replace(/,/g, ''), 10);
  return {
    target,
    prefix: str.slice(0, match.index),
    suffix: str.slice(match.index + match[0].length),
  };
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {string|number} value Final display value (may include +, text, etc.)
 * @param {boolean} start When true, run the count-up (once).
 * @param {number} duration Animation length in ms.
 * @returns {string} The current display string to render.
 */
export const useCountUp = (value, start, duration = 1200) => {
  const parsed = parse(value);
  const [display, setDisplay] = useState(() =>
    parsed ? `${parsed.prefix}0${parsed.suffix}` : value
  );
  const rafRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    // Non-numeric, not started yet, or already animated: just show the value.
    if (!parsed || !start || doneRef.current) {
      if (!parsed) setDisplay(value);
      return undefined;
    }

    if (prefersReducedMotion()) {
      setDisplay(value);
      doneRef.current = true;
      return undefined;
    }

    doneRef.current = true;
    const from = 0;
    const { target, prefix, suffix } = parsed;
    let startTs = 0;
    // easeOutCubic — fast then settling, reads as "counting up" not linear.
    const ease = t => 1 - Math.pow(1 - t, 3);

    const tick = ts => {
      if (!startTs) startTs = ts;
      const t = Math.min((ts - startTs) / duration, 1);
      const current = Math.round(from + (target - from) * ease(t));
      setDisplay(`${prefix}${current}${suffix}`);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
    // value is intentionally the only content dep; `start` flips once false→true.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, start]);

  return display;
};
