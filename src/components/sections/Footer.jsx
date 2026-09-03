/**
 * @file Footer.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Footer — dark, with wordmark, quick links, social icons, and
 *   copyright.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Terminal, ArrowUp } from 'lucide-react';
import { Github, Linkedin } from '../icons/BrandIcons.jsx';
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
    // ink, so the canvas/ink alternation that runs down the page ends on a
    // beat: Contact is canvas, and canvas-on-canvas here left the footer
    // separated from it by nothing but the hairline.
    <footer className='relative overflow-hidden border-t border-hairline bg-ink'>
      <div className='container-custom py-14'>
        <div className='flex flex-col gap-10 md:flex-row md:items-start md:justify-between'>
          {/* Brand + tagline */}
          <div className='max-w-sm'>
            <div className='flex items-center gap-2.5'>
              <span className='flex h-9 w-9 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-300'>
                <Terminal size={18} />
              </span>
              <span className='font-mono text-sm font-semibold text-white'>
                aswin<span className='text-brand-400'>cloud</span>
              </span>
            </div>
            {/* Not the hero headline again — by this point the page has said
                "AI accelerators go faster" in the hero, and the footer is the
                one place a different register fits. */}
            <p className='mt-4 text-sm leading-relaxed text-slate-400'>
              Performance engineer by day, one-person ops team by night. Pondicherry, India.
            </p>
            <div className='mt-5 flex items-center gap-2.5'>
              {SOCIALS.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith('http') ? '_blank' : undefined}
                  rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  aria-label={
                    social.href.startsWith('http')
                      ? `${social.label} (opens in a new tab)`
                      : social.label
                  }
                  className='flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-surface text-slate-400 transition-colors hover:border-brand-500/40 hover:text-brand-300'
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {/* -my-1 cancels the padding's contribution to the nav's own height so
              the column keeps its original rhythm while each row grows. */}
          <nav aria-label='Footer' className='-my-1 flex flex-col gap-1'>
            <span className='mb-1 font-mono text-xs uppercase tracking-wider text-slate-400'>
              Links
            </span>
            {LINKS.map(link => {
              // py-1.5 on an inline-flex row: the text is 20px, which leaves the
              // hit area 4px under the 24px WCAG 2.5.8 floor. `w-fit` keeps the
              // target the width of the words rather than the whole column, so
              // the padding grows the target without widening it into dead space.
              const cls =
                'inline-flex w-fit py-1.5 text-sm text-slate-400 transition-colors hover:text-brand-300';
              // Internal routes go through the router so basename is respected
              // and navigation stays client-side; external links use <a>.
              return link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={cls}
                  // Contains the visible label (WCAG 2.5.3) and says what the
                  // hero's résumé button already says about leaving the page.
                  aria-label={`${link.label} (opens in a new tab)`}
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} to={link.href} viewTransition className={cls}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className='mt-12 flex flex-col items-center justify-between gap-4 border-t border-hairline pt-6 sm:flex-row'>
          <p className='font-mono text-xs text-slate-400'>
            © {currentYear} Aswin. All rights reserved.
          </p>
          {/* -my-1.5 keeps the row's visual height unchanged while the padding
              lifts the 16px-tall link over the 24px WCAG 2.5.8 target floor. */}
          <a
            href='#home'
            className='-my-1.5 inline-flex items-center gap-1.5 py-1.5 font-mono text-xs text-slate-400 transition-colors hover:text-brand-300'
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
