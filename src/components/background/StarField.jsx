/**
 * @file StarField.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Decorative hero layer: a field of faint stars that twinkle at
 *   staggered intervals. Pure CSS animation (the existing pulse-slow keyframe),
 *   so nothing runs per frame; aria-hidden, and it freezes under the global
 *   prefers-reduced-motion block.
 */

import React from 'react';

// Deterministic scatter via a tiny seeded PRNG: the field is identical on every
// mount and there is no Math.random in render. Placement quality only needs to
// look unstructured, which this comfortably clears.
const seeded = (() => {
  let s = 0x9e3779b9;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();

const STARS = Array.from({ length: 46 }, () => ({
  top: `${(seeded() * 100).toFixed(2)}%`,
  left: `${(seeded() * 100).toFixed(2)}%`,
  size: (seeded() * 2 + 1).toFixed(2),
  delay: `${(seeded() * 3).toFixed(2)}s`,
  opacity: (seeded() * 0.5 + 0.15).toFixed(2),
}));

const StarField = () => (
  <div aria-hidden='true' className='pointer-events-none absolute inset-0 overflow-hidden'>
    {STARS.map((star, i) => (
      <span
        key={i}
        className='absolute rounded-full bg-brand-200 animate-pulse-slow'
        style={{
          top: star.top,
          left: star.left,
          width: `${star.size}px`,
          height: `${star.size}px`,
          opacity: star.opacity,
          animationDelay: star.delay,
        }}
      />
    ))}
  </div>
);

export default StarField;
