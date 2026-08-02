/**
 * @file RotatingRoles.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description The hero role line, animated: it types out a short rotation of
 *   roles with a blinking caret, then erases and moves to the next. Driven by
 *   chained timeouts (nothing runs per frame), and it rests on the first role
 *   under reduced motion so the line is still meaningful without movement.
 */

import React, { useEffect, useState } from 'react';

const ROLES = [
  'Software Engineer',
  'AI Accelerator Optimizer',
  'Performance Engineer',
  'Self-Hosting Enthusiast',
];

const TYPE_MS = 65;
const ERASE_MS = 35;
const HOLD_MS = 1700;

const RotatingRoles = () => {
  const [text, setText] = useState(ROLES[0]);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;

    let timer;
    let role = 0;
    let char = ROLES[0].length;
    let erasing = false;

    const step = () => {
      const full = ROLES[role];
      if (!erasing) {
        char += 1;
        setText(full.slice(0, char));
        if (char >= full.length) {
          erasing = true;
          timer = setTimeout(step, HOLD_MS);
          return;
        }
        timer = setTimeout(step, TYPE_MS);
      } else {
        char -= 1;
        setText(full.slice(0, Math.max(char, 0)));
        if (char <= 0) {
          erasing = false;
          role = (role + 1) % ROLES.length;
          char = 0;
        }
        timer = setTimeout(step, ERASE_MS);
      }
    };

    // First role is already fully shown on mount; hold, then start erasing.
    timer = setTimeout(step, HOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <span className='eyebrow text-brand-300'>
      <span aria-live='polite'>{text}</span>
      <span
        aria-hidden='true'
        className='ml-1 inline-block h-[1em] w-[2px] translate-y-[2px] bg-brand-300 animate-pulse-slow'
      />
      <span className='text-slate-500'>· Pondicherry, India</span>
    </span>
  );
};

export default RotatingRoles;
