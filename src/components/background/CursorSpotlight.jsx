/**
 * @file CursorSpotlight.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Interactive hero layer: a soft radial glow that tracks the
 *   pointer, giving the backdrop depth as the visitor moves across it. Skipped
 *   entirely on coarse pointers and under reduced motion. The pointer handler is
 *   rAF-coalesced so it only wakes while the cursor is actually moving.
 *   aria-hidden.
 */

import React, { useEffect, useRef } from 'react';

const CursorSpotlight = () => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!parent) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    if (reduce || coarse) return undefined;

    let raf = 0;
    const onMove = e => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = parent.getBoundingClientRect();
        el.style.setProperty('--x', `${e.clientX - rect.left}px`);
        el.style.setProperty('--y', `${e.clientY - rect.top}px`);
        el.style.opacity = '1';
      });
    };
    const onLeave = () => {
      el.style.opacity = '0';
    };

    parent.addEventListener('pointermove', onMove);
    parent.addEventListener('pointerleave', onLeave);
    return () => {
      parent.removeEventListener('pointermove', onMove);
      parent.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden='true'
      className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300'
      style={{
        background:
          'radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(16,185,129,0.10), transparent 60%)',
      }}
    />
  );
};

export default CursorSpotlight;
