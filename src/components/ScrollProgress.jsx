/**
 * @file ScrollProgress.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Scroll progress indicator component
 */

import React from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  // Fade in only after scrolling — avoids a 1px / blur artifact at the top when progress is 0
  const opacity = useTransform(scrollYProgress, [0, 0.02], [0, 1]);

  // aria-hidden on both: these are two decorative gradient bars conveying
  // something a screen reader already knows better than the DOM can say it —
  // where you are in the document. Announced, they are noise with no accessible
  // name, and the glow layer is a second copy of the same nothing.
  return (
    <>
      {/* Top scroll progress bar */}
      <motion.div
        aria-hidden='true'
        className='pointer-events-none fixed top-0 left-0 right-0 h-0.5 origin-left z-9999 bg-linear-to-r from-brand-400 via-emerald-300 to-cyan-300'
        style={{ scaleX, opacity }}
      />

      {/* Glow effect */}
      <motion.div
        aria-hidden='true'
        className='pointer-events-none fixed top-0 left-0 right-0 h-0.5 origin-left z-9998 bg-linear-to-r from-brand-400/60 via-emerald-300/60 to-cyan-300/60 blur-[3px]'
        style={{ scaleX, opacity }}
      />
    </>
  );
};

export default ScrollProgress;
