/**
 * @file FloatingTechIcons.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Decorative hero layer: a scattering of tech-stack glyphs that
 *   drift and bob behind the headline, hinting at the stack without a word of
 *   copy. Purely decorative, so it is aria-hidden; its motion collapses under
 *   prefers-reduced-motion via the app-level MotionConfig.
 */

import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Cloud, Container, Database, GitBranch, Terminal, Boxes, Zap } from 'lucide-react';

// Authored layout rather than random-on-mount: position, size, drift vector and
// duration are fixed per glyph so the scatter is deliberate and stable.
const ICONS = [
  { Icon: Cpu, top: '18%', left: '9%', size: 40, dur: 11, dx: 14, dy: -18 },
  { Icon: Cloud, top: '24%', left: '83%', size: 46, dur: 13, dx: -16, dy: 12 },
  { Icon: Container, top: '64%', left: '14%', size: 38, dur: 12, dx: 12, dy: 16 },
  { Icon: Database, top: '70%', left: '80%', size: 42, dur: 14, dx: -12, dy: -14 },
  { Icon: GitBranch, top: '42%', left: '5%', size: 34, dur: 10, dx: 16, dy: 10 },
  { Icon: Terminal, top: '13%', left: '58%', size: 30, dur: 15, dx: -10, dy: 14 },
  { Icon: Boxes, top: '80%', left: '48%', size: 36, dur: 13, dx: 12, dy: -12 },
  { Icon: Zap, top: '34%', left: '91%', size: 28, dur: 9, dx: -14, dy: -10 },
];

const FloatingTechIcons = () => {
  return (
    <div aria-hidden='true' className='pointer-events-none absolute inset-0 overflow-hidden'>
      {ICONS.map(({ Icon, top, left, size, dur, dx, dy }, i) => (
        <motion.span
          key={i}
          className='absolute text-brand-400/20'
          style={{ top, left }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, x: [0, dx, 0], y: [0, dy, 0] }}
          transition={{
            opacity: { duration: 1.2, delay: 0.2 + i * 0.08 },
            x: { duration: dur, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: dur * 1.3, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <Icon size={size} strokeWidth={1.25} />
        </motion.span>
      ))}
    </div>
  );
};

export default FloatingTechIcons;
