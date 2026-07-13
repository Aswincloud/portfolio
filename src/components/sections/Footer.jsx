/**
 * @file Footer.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Footer — dark, with wordmark, quick links, social icons, and
 *   copyright.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Linkedin, Github, Terminal, ArrowUp } from 'lucide-react';
import { RESUME_URL } from '../../data/links.js';

const LINKS = [
  { label: 'Privacy Policy', href: '/privacy', external: false },
  { label: 'Terms & Conditions', href: '/terms', external: false },
  { label: 'Source Code', href: 'https://github.com/Aswincloud/portfolio', external: true },
  { label: 'Résumé', href: RESUME_URL, external: true },
];

const SOCIALS = [
  { icon: Mail, href: 'mailto:contact@aswincloud.com', label: 'Email' },
  { icon: Linkedin, href: 'https://www.linkedin.com/in/aswin4122001/', label: 'LinkedIn' },
  { icon: Github, href: 'https://github.com/Aswincloud', label: 'GitHub' },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='relative overflow-hidden border-t border-hairline bg-canvas'>
      <div className='container-custom py-14'>
        <div className='flex flex-col gap-10 md:flex-row md:items-start md:justify-between'>
          {/* Brand + tagline */}
          <div className='max-w-sm'>
            <div className='flex items-center gap-2.5'>
              <span className='flex h-9 w-9 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-300'>
                <Terminal size={18} />
              </span>
              <span className='font-mono text-sm font-semibold text-white'>
                aswin<span className='text-brand-400'>.dev</span>
              </span>
            </div>
            <p className='mt-4 text-sm leading-relaxed text-slate-500'>
              Software engineer making AI accelerators go faster — and running a personal cloud for
              the fun of it.
            </p>
            <div className='mt-5 flex items-center gap-2.5'>
              {SOCIALS.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith('http') ? '_blank' : undefined}
                  rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  aria-label={social.label}
                  className='flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-surface text-slate-400 transition-colors hover:border-brand-500/40 hover:text-brand-300'
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <nav aria-label='Footer' className='flex flex-col gap-3'>
            <span className='font-mono text-xs uppercase tracking-wider text-slate-600'>Links</span>
            {LINKS.map(link => {
              const cls = 'text-sm text-slate-400 transition-colors hover:text-brand-300';
              // Internal routes go through the router so basename is respected
              // and navigation stays client-side; external links use <a>.
              return link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={cls}
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} to={link.href} className={cls}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className='mt-12 flex flex-col items-center justify-between gap-4 border-t border-hairline pt-6 sm:flex-row'>
          <p className='font-mono text-xs text-slate-600'>
            © {currentYear} Aswin. All rights reserved.
          </p>
          <a
            href='#home'
            className='inline-flex items-center gap-1.5 font-mono text-xs text-slate-500 transition-colors hover:text-brand-300'
          >
            Back to top
            <ArrowUp size={13} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
