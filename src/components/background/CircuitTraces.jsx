/**
 * @file CircuitTraces.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Hero backdrop accent: faint PCB-style circuit traces with a
 *   handful of bright "signal" pulses that march along the lines. Purely
 *   decorative, so it is aria-hidden and never intercepts pointer events.
 *
 *   The motion is a pure-CSS stroke-dashoffset march on a few SVG paths — one
 *   compositor-friendly property per pulse, nothing runs per frame, in keeping
 *   with this repo's no-rAF stance. The scoped keyframes below collapse under
 *   prefers-reduced-motion via the global CSS override, leaving the traces
 *   sitting still.
 */

import React from 'react';

// Orthogonal trace geometry, authored once and shared between the faint base
// line and the bright travelling pulse so the pulse rides exactly on the trace.
const TRACES = [
  'M -20 120 H 300 V 260 H 640',
  'M 1220 190 H 900 V 380 H 560',
  'M 90 820 V 560 H 430 V 410',
  'M 1120 820 V 520 H 760 V 300 H 940',
  'M -20 650 H 220 V 700 H 520',
];

// Pads sit at a few trace junctions to read as solder points.
const PADS = [
  [300, 260],
  [900, 380],
  [430, 560],
  [760, 300],
  [220, 700],
];

const CircuitTraces = () => {
  return (
    <div
      aria-hidden='true'
      className='pointer-events-none absolute inset-0 overflow-hidden'
      style={{ opacity: 0.5 }}
    >
      <style>{`
        @keyframes circuitDash {
          from { stroke-dashoffset: 340; }
          to { stroke-dashoffset: 0; }
        }
        .ct-pulse {
          stroke-dasharray: 60 280;
          animation: circuitDash 4.2s linear infinite;
        }
      `}</style>
      <svg
        className='h-full w-full'
        viewBox='0 0 1200 800'
        preserveAspectRatio='xMidYMid slice'
        fill='none'
      >
        {TRACES.map((d, i) => (
          <path key={`base-${i}`} d={d} stroke='rgba(34,211,238,0.16)' strokeWidth='1.5' />
        ))}
        {TRACES.slice(0, 3).map((d, i) => (
          <path
            key={`pulse-${i}`}
            d={d}
            className='ct-pulse'
            stroke='rgba(16,185,129,0.7)'
            strokeWidth='2'
            style={{ animationDelay: `${i * -1.5}s` }}
          />
        ))}
        {PADS.map(([cx, cy], i) => (
          <circle key={`pad-${i}`} cx={cx} cy={cy} r='3.5' fill='rgba(34,211,238,0.35)' />
        ))}
      </svg>
    </div>
  );
};

export default CircuitTraces;
