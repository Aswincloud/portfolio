/**
 * @file Prose.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Styled prose primitives shared by every blog post, so posts are
 *   authored as plain JSX (no markdown pipeline) while staying visually
 *   consistent with the site's dark design system.
 */

import React from 'react';

export const H2 = ({ children }) => (
  <h2 className='mt-12 scroll-mt-24 text-2xl font-bold text-white sm:text-3xl'>{children}</h2>
);

export const H3 = ({ children }) => (
  <h3 className='mt-8 text-lg font-semibold text-white sm:text-xl'>{children}</h3>
);

export const P = ({ children }) => (
  <p className='mt-5 leading-relaxed text-slate-300'>{children}</p>
);

export const UL = ({ children }) => <ul className='mt-5 space-y-2.5 text-slate-300'>{children}</ul>;

export const LI = ({ children }) => (
  <li className='flex items-start gap-3 leading-relaxed'>
    <span className='mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400' />
    <span className='min-w-0'>{children}</span>
  </li>
);

// Inline code / identifier.
export const Code = ({ children }) => (
  <code className='rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-brand-200'>
    {children}
  </code>
);

export const A = ({ href, children }) => (
  <a
    href={href}
    target={href.startsWith('http') ? '_blank' : undefined}
    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
    className='text-brand-300 underline decoration-brand-500/40 underline-offset-2 transition-colors hover:text-brand-200 hover:decoration-brand-400'
  >
    {children}
  </a>
);

// A pulled-out aside — used for "lesson learned" beats.
export const Callout = ({ children }) => (
  <div className='mt-6 rounded-xl border border-brand-500/20 bg-brand-500/5 p-5 leading-relaxed text-slate-300'>
    {children}
  </div>
);

// A fenced code / terminal block.
export const Pre = ({ children }) => (
  <pre className='mt-5 overflow-x-auto rounded-xl border border-hairline bg-surface p-4 font-mono text-[13px] leading-relaxed text-slate-300'>
    <code>{children}</code>
  </pre>
);
