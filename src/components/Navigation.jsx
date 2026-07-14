/**
 * @file Navigation.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Performance-optimized navigation component with routing and mobile menu support
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Terminal } from 'lucide-react';
import { useThrottledScroll, usePageTransitions } from '../hooks';
import { RESUME_URL } from '../data/links.js';

// Performance-optimized Navigation component
const Navigation = React.memo(function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const { navigateToSection, currentSection } = usePageTransitions();
  const isHomePage = location.pathname === '/';

  const handleScroll = React.useCallback(() => {
    setScrolled(window.scrollY > 40);
  }, []);

  useThrottledScroll(handleScroll);

  const handleNavClick = React.useCallback(
    (e, href) => {
      if (href.startsWith('#') && isHomePage) {
        e.preventDefault();
        navigateToSection(href.replace('#', ''));
        setIsMenuOpen(false);
      } else {
        setIsMenuOpen(false);
      }
    },
    [navigateToSection, isHomePage]
  );

  // Section labels double as mono nav items — no icons, keeps the bar clean.
  const navigationItems = React.useMemo(
    () => [
      { section: 'about', label: 'About' },
      { section: 'experience', label: 'Experience' },
      { section: 'skills', label: 'Skills' },
      { section: 'projects', label: 'Projects' },
      { section: 'technologies', label: 'Stack' },
      { section: 'contact', label: 'Contact' },
    ],
    []
  );

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || !isHomePage || isMenuOpen
          ? 'border-b border-hairline bg-ink/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className='container-custom'>
        <div className='flex h-16 items-center justify-between'>
          {/* Wordmark */}
          <Link
            to='/'
            className='group flex items-center gap-2.5'
            aria-label='Aswin — home'
            onClick={e => handleNavClick(e, '#home')}
          >
            <span className='flex h-9 w-9 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-300 transition-colors group-hover:border-brand-400/60'>
              <Terminal size={18} />
            </span>
            <span className='font-mono text-sm font-semibold text-white'>
              aswin<span className='text-brand-400'>cloud</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className='hidden items-center gap-1 md:flex'>
            {navigationItems.map(item => {
              const isActive = isHomePage && currentSection === item.section;
              const cls = `relative rounded-lg px-3.5 py-2 font-mono text-[13px] transition-colors ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-white'
              }`;
              return isHomePage ? (
                <button
                  key={item.section}
                  onClick={e => handleNavClick(e, `#${item.section}`)}
                  className={cls}
                >
                  {isActive && (
                    <motion.span
                      layoutId='nav-active'
                      className='absolute inset-0 -z-10 rounded-lg border border-brand-500/30 bg-brand-500/10'
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {item.label}
                </button>
              ) : (
                <Link key={item.section} to={`/#${item.section}`} className={cls}>
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className='flex items-center gap-2'>
            <a
              href={RESUME_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='hidden rounded-lg border border-brand-500/40 bg-brand-500/10 px-4 py-2 font-mono text-[13px] font-medium text-brand-300 transition-colors hover:bg-brand-500/20 hover:text-brand-200 sm:inline-flex'
            >
              Résumé
            </a>

            <button
              onClick={() => setIsMenuOpen(v => !v)}
              className='rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/5 hover:text-white md:hidden'
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile sheet */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className='overflow-hidden border-t border-hairline md:hidden'
            >
              <div className='space-y-1 py-4'>
                {navigationItems.map(item => {
                  const isActive = isHomePage && currentSection === item.section;
                  const cls = `flex w-full items-center rounded-lg px-4 py-3 font-mono text-sm transition-colors ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-200'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`;
                  return isHomePage ? (
                    <button
                      key={item.section}
                      onClick={e => handleNavClick(e, `#${item.section}`)}
                      className={cls}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={item.section}
                      to={`/#${item.section}`}
                      onClick={() => setIsMenuOpen(false)}
                      className={cls}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <a
                  href={RESUME_URL}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='mt-2 flex items-center rounded-lg border border-brand-500/40 bg-brand-500/10 px-4 py-3 font-mono text-sm font-medium text-brand-300'
                >
                  View Résumé
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
});

export default Navigation;
