/**
 * @file useExperienceCalculator.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Custom React hook for calculating professional experience duration
 */

import { useState, useEffect } from 'react';

// First day at MulticoreWare. Must agree with the "June 2023 – Present" period
// on the experience card and the résumé; the hooks test checks the month. This
// was '2023-01-06' — a DD-MM slip that read as 6 January — which overstated the
// hero stat and the card's tenure by a year for the first half of every year.
export const EXPERIENCE_START = '2023-06-01';

/** Whole calendar months since the start, rendered as the site shows tenure. */
const formatExperience = (now = new Date()) => {
  const startDate = new Date(EXPERIENCE_START);

  const diffInMonths =
    (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());

  const years = Math.floor(diffInMonths / 12);
  const months = diffInMonths % 12;

  if (years > 0) return `${years}+ year${years > 1 ? 's' : ''}`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''}`;
  return 'Less than a month';
};

export const useExperienceCalculator = () => {
  // Computed for the first render, not in an effect. The value was '' until
  // the effect ran, which the hero's stat strip showed as "—" for a frame and
  // then counted up from — a visible flicker on every load, for a number that
  // is a pure function of the clock and costs nothing to have at mount.
  const [experience, setExperience] = useState(() => formatExperience());

  useEffect(() => {
    // Keep it current across a tab left open past midnight on the 1st.
    const interval = setInterval(() => setExperience(formatExperience()), 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return experience;
};
