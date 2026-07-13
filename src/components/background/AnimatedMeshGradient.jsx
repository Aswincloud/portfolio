/**
 * @file AnimatedMeshGradient.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Hero backdrop: deep-navy canvas with a dotted grid, three slow
 *   aurora glows (emerald + cyan + indigo), and a radial vignette. Purely
 *   decorative, so it is aria-hidden and its motion collapses under
 *   prefers-reduced-motion via the global CSS override.
 */

import React from 'react';

const AnimatedMeshGradient = () => {
  return (
    <div aria-hidden='true' className='absolute inset-0 overflow-hidden bg-ink'>
      {/* Dotted engineering grid */}
      <div className='absolute inset-0 grid-bg opacity-70' />

      {/* Aurora glow — emerald */}
      <div
        className='absolute -top-32 -left-24 h-[42rem] w-[42rem] rounded-full animate-aurora'
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.20) 0%, transparent 62%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Aurora glow — cyan */}
      <div
        className='absolute top-10 right-[-8rem] h-[40rem] w-[40rem] rounded-full animate-aurora'
        style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.16) 0%, transparent 62%)',
          filter: 'blur(48px)',
          animationDelay: '-8s',
        }}
      />

      {/* Aurora glow — indigo, low + center for depth */}
      <div
        className='absolute bottom-[-14rem] left-1/3 h-[36rem] w-[36rem] rounded-full animate-aurora'
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)',
          filter: 'blur(56px)',
          animationDelay: '-16s',
        }}
      />

      {/* Radial vignette to keep edges dark and focus the center */}
      <div
        className='absolute inset-0'
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, transparent 40%, rgba(6,10,19,0.65) 100%)',
        }}
      />

      {/* Bottom fade into the next section */}
      <div className='absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-ink to-transparent' />
    </div>
  );
};

export default AnimatedMeshGradient;
