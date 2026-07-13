/**
 * @file NotFound.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description 404 Not Found page — dark, on-brand, with navigation back into
 *   the site.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react';

const QUICK_LINKS = [
  { to: '/#about', label: 'About' },
  { to: '/#projects', label: 'Projects' },
  { to: '/#experience', label: 'Experience' },
  { to: '/#contact', label: 'Contact' },
];

const NotFound = () => {
  return (
    <div className='relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink py-24'>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute left-1/2 top-1/3 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full opacity-60'
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 60%)' }}
      />
      <div className='absolute inset-0 grid-bg opacity-50' aria-hidden='true' />

      <div className='container-custom relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='mx-auto max-w-xl text-center'
        >
          <span className='mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10 text-brand-300'>
            <AlertTriangle size={30} />
          </span>

          <h1 className='gradient-text text-7xl font-bold sm:text-8xl'>404</h1>
          <h2 className='mt-3 text-2xl font-bold text-white'>Page not found</h2>
          <p className='mx-auto mt-4 max-w-md leading-relaxed text-slate-400'>
            The page you&apos;re looking for doesn&apos;t exist — it may have moved, or the URL is
            off by a character.
          </p>

          <div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
            <Link
              to='/'
              className='inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-500 to-cyan-500 px-6 py-3 font-semibold text-ink shadow-lg shadow-brand-500/20 transition-shadow hover:shadow-xl hover:shadow-brand-500/30 sm:w-auto'
            >
              <Home size={18} />
              Go home
            </Link>
            <button
              onClick={() => window.history.back()}
              className='inline-flex w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-surface px-6 py-3 font-semibold text-slate-200 transition-colors hover:border-slate-600 sm:w-auto'
            >
              <ArrowLeft size={18} />
              Go back
            </button>
          </div>

          <div className='mt-12 flex flex-wrap items-center justify-center gap-2'>
            {QUICK_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className='rounded-lg border border-hairline bg-surface px-3.5 py-1.5 font-mono text-xs text-slate-400 transition-colors hover:border-brand-500/40 hover:text-brand-300'
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
