/**
 * @file AnimatedMeshGradient.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Advanced animated mesh gradient background for hero section
 */

import React from 'react';
import { motion } from 'motion/react';

const AnimatedMeshGradient = () => {
  return (
    <div className='absolute inset-0 overflow-hidden'>
      {/* Base gradient layers */}
      <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' />
      <div className='absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-transparent to-pink-900/40' />

      {/* Animated gradient orbs */}
      <motion.div
        className='absolute top-0 left-0 w-[500px] h-[500px] rounded-full'
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.4) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className='absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full'
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
          filter: 'blur(90px)',
        }}
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className='absolute bottom-0 left-1/3 w-[450px] h-[450px] rounded-full'
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
        animate={{
          x: [0, -50, 0],
          y: [0, -75, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className='absolute top-1/2 left-1/2 w-[550px] h-[550px] rounded-full'
        style={{
          background: 'radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 70%)',
          filter: 'blur(85px)',
        }}
        animate={{
          x: [0, 75, 0],
          y: [0, -50, 0],
          scale: [1, 1.25, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Mesh pattern overlay */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(236,72,153,0.3)_0%,transparent_50%)]' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.3)_0%,transparent_50%)]' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_60%_80%,rgba(168,85,247,0.25)_0%,transparent_40%)]' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(34,197,94,0.2)_0%,transparent_35%)]' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_90%_90%,rgba(251,146,60,0.22)_0%,transparent_45%)]' />
      </div>
    </div>
  );
};

export default AnimatedMeshGradient;
