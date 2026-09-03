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

export const useExperienceCalculator = () => {
  const [experience, setExperience] = useState('');

  useEffect(() => {
    const calculateExperience = () => {
      const startDate = new Date(EXPERIENCE_START);
      const currentDate = new Date();

      const diffInMonths =
        (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
        (currentDate.getMonth() - startDate.getMonth());

      const years = Math.floor(diffInMonths / 12);
      const months = diffInMonths % 12;

      if (years > 0) {
        setExperience(`${years}+ year${years > 1 ? 's' : ''}`);
      } else if (months > 0) {
        setExperience(`${months} month${months > 1 ? 's' : ''}`);
      } else {
        setExperience('Less than a month');
      }
    };

    calculateExperience();
    const interval = setInterval(calculateExperience, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return experience;
};
