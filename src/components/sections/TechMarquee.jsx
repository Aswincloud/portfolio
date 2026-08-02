/**
 * @file TechMarquee.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description A hero ribbon: an infinite marquee of the tools in the stack,
 *   under the stat strip. Pure CSS translate via the existing marquee keyframe
 *   (no per-frame JS); it pauses on hover, fades at both edges with a mask, and
 *   is aria-hidden since it is decorative reinforcement of the Technologies
 *   section below.
 */

import React from 'react';

const ITEMS = [
  'C++',
  'CUDA',
  'Python',
  'React',
  'Docker',
  'Kubernetes',
  'Linux',
  'PyTorch',
  'MLIR',
  'Vite',
  'Node.js',
  'Cloudflare',
];

const TechMarquee = () => (
  <div
    aria-hidden='true'
    className='group relative mx-auto mt-7 w-full max-w-2xl overflow-hidden'
    style={{
      maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
      WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
    }}
  >
    <div className='flex w-max animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]'>
      {[0, 1].map(copy => (
        <div key={copy} className='flex shrink-0'>
          {ITEMS.map(tech => (
            <span
              key={`${copy}-${tech}`}
              className='mx-5 font-mono text-sm tracking-wide text-slate-500'
            >
              {tech}
              <span className='ml-5 text-brand-500/40'>/</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default TechMarquee;
