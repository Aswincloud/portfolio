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
 * @param {object} [opts]
 * @param {number} [opts.duration=1500] Climb length in ms.
 * @param {number} [opts.delay=0] Wait before starting — used to hold the climb
 *   until the element's entrance animation has finished, otherwise most of the
 *   count happens while the tile is still faded out and only the last digit or
 *   two is visible.
 * @returns {string} The current display string to render.
 */
export const useCountUp = (value, start, { duration = 1500, delay = 0 } = {}) => {
  const parsed = parse(value);
  const [display, setDisplay] = useState(() =>
    parsed ? `${parsed.prefix}0${parsed.suffix}` : value
  );
  const rafRef = useRef(0);
  const timerRef = useRef(0);
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
    // null rather than 0 as the "not yet started" sentinel: a browser is free to
    // pass 0 as the first frame timestamp (it is a time origin offset, and the
    // spec sets no floor), and a falsy check would then re-anchor the start on
    // every frame — t stays 0 and the number never leaves its initial value.
    let startTs = null;
    // easeOutQuad — gentle settle at the end but near-even pacing across the
    // run, so the digits visibly tick up rather than snapping to the total.
    const ease = t => 1 - (1 - t) * (1 - t);

    const tick = ts => {
      if (startTs === null) startTs = ts;
      const t = Math.min((ts - startTs) / duration, 1);
      const current = Math.round(from + (target - from) * ease(t));
      setDisplay(`${prefix}${current}${suffix}`);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    // Hold at 0 until the entrance animation is done, then climb.
    timerRef.current = window.setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timerRef.current);
    };
    // value is intentionally the only content dep; `start` flips once false→true.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, start]);

  return display;
};
