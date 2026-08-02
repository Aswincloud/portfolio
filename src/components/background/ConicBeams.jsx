/**
 * @file ConicBeams.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Decorative hero layer: a slow rotating conic "lighthouse" sweep
 *   in the brand emerald→cyan, adding motion behind the headline. It is a single
 *   compositor transform on one element (cheap), aria-hidden, and stills under
 *   reduced motion via the app-level MotionConfig.
 */

import React from 'react';
import { motion } from 'motion/react';

const ConicBeams = () => (
  <div
    aria-hidden='true'
    className='pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden'
  >
    <motion.div
      className='h-[120vmax] w-[120vmax] rounded-full opacity-[0.13]'
      style={{
        background:
          'conic-gradient(from 0deg, transparent 0deg, rgba(16,185,129,0.55) 42deg, transparent 96deg, transparent 180deg, rgba(34,211,238,0.5) 222deg, transparent 288deg, transparent 360deg)',
        filter: 'blur(44px)',
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

export default ConicBeams;
