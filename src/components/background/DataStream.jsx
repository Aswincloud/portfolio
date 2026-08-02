/**
 * @file DataStream.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Hero backdrop accent: a few restrained columns of monospace
 *   binary digits drifting downward, evoking data moving through the stack.
 *   Purely decorative, so it is aria-hidden and never intercepts pointer events.
 *
 *   Each column is one CSS translateY loop over a doubled string, so the scroll
 *   is seamless and nothing runs per frame — in keeping with this repo's no-rAF
 *   stance. The content is a fixed literal (no Math.random), so every mount is
 *   identical and matches the prerendered shell. Motion collapses under
 *   prefers-reduced-motion via the global CSS override.
 */

import React from 'react';

// Fixed digit strings — deterministic, so server/prerender and client agree.
const COLUMNS = [
  {
    left: '8%',
    dur: '17s',
    delay: '0s',
    bits: '01001100101101001011010011001010',
  },
  {
    left: '23%',
    dur: '21s',
    delay: '-6s',
    bits: '11010010011010110010100110101101',
  },
  {
    left: '44%',
    dur: '15s',
    delay: '-3s',
    bits: '00110101101001011010011010010110',
  },
  {
    left: '63%',
    dur: '24s',
    delay: '-11s',
    bits: '10101100100110101100101101001010',
  },
  {
    left: '81%',
    dur: '19s',
    delay: '-8s',
    bits: '01101001100101101001011001101010',
  },
];

const DataStream = () => {
  return (
    <div
      aria-hidden='true'
      className='pointer-events-none absolute inset-0 overflow-hidden'
      style={{
        maskImage: 'linear-gradient(to bottom, transparent, #000 18%, #000 72%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 18%, #000 72%, transparent)',
      }}
    >
      <style>{`
        @keyframes dataFall {
          from { transform: translateY(-50%); }
          to { transform: translateY(0); }
        }
      `}</style>
      {COLUMNS.map((col, i) => (
        <div
          key={i}
          className='absolute top-0 select-none font-mono text-[13px] leading-[1.9] tracking-[0.35em] text-cyan-400/20'
          style={{
            left: col.left,
            animation: `dataFall ${col.dur} linear infinite`,
            animationDelay: col.delay,
          }}
        >
          {(col.bits + col.bits).split('').map((b, j) => (
            <div key={j}>{b}</div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default DataStream;
