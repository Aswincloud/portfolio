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

  return (
    <>
      {/* Top scroll progress bar */}
      <motion.div
        className='pointer-events-none fixed top-0 left-0 right-0 h-1 origin-left z-[9999] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500'
        style={{ scaleX, opacity }}
      />

      {/* Glow effect */}
      <motion.div
        className='pointer-events-none fixed top-0 left-0 right-0 h-1 origin-left z-[9998] bg-gradient-to-r from-pink-500/50 via-purple-500/50 to-cyan-500/50 blur-sm'
        style={{ scaleX, opacity }}
      />
    </>
  );
};

export default ScrollProgress;
