/**
 * @file HeroSection.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Hero section — dark systems-engineer aesthetic with aurora
 *   backdrop, mono role line, headline, CTAs, socials, and a stat strip.
 */

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { Mail, ArrowRight, FileText, ArrowDown, MessageCircle } from 'lucide-react';
import { Github, Linkedin } from '../icons/BrandIcons.jsx';
import { useExperienceCalculator, useThrottledScroll, useRipple, useCountUp } from '../../hooks';
import { AnimatedMeshGradient } from '../background';
import TechMarquee from './TechMarquee.jsx';
import { buttonMotion } from '../../utils/microInteractions';
import { RESUME_URL } from '../../data/links.js';
import {
  HERO_HEADLINE_LINES,
  HERO_HEADLINE_ACCENT,
  HERO_INTRO,
  HERO_INTRO_EMPHASIS,
  splitAround,
} from '../../data/heroContent.js';

// The headline and intro are read from data rather than written out here,
// because the build-time prerender in scripts/vite-plugin-prerender-hero.js
// puts the same words into the static shell's <h1>. Two hand-written copies of
// one sentence is the drift this repo keeps having to undo.
const HEADLINE = HERO_HEADLINE_LINES.map(line => splitAround(line, HERO_HEADLINE_ACCENT));
const INTRO = splitAround(HERO_INTRO, HERO_INTRO_EMPHASIS);

// One stat cell. Split into its own component so each can own a useCountUp
// call (hooks can't run inside the parent's .map). `start` flips true when the
// strip scrolls into view, kicking off the 0→value climb once.
const StatCell = ({ value, label, start }) => {
  // Hold the climb until the strip's entrance fade (delay 0.55s + 0.6s) has
  // mostly played, so the whole 0→value count is visible rather than finishing
  // behind the fade-in.
  const display = useCountUp(value, start, { delay: 750, duration: 1500 });
  return (
    // A <dl> requires dt before dd in source order, so the number is put above
    // its label visually with flex + order. The flex column is load-bearing:
    // `order` is ignored outside a flex/grid container, and without it the cell
    // silently rendered label-over-number (the label's own mt-1 only makes sense
    // under a number, which is what gave the inversion away).
    <div className='flex flex-col bg-surface/70 px-2 py-3.5 text-center backdrop-blur-sm sm:px-4 sm:py-4'>
      <dt className='order-2 mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-500 sm:text-[11px]'>
        {label}
      </dt>
      <dd className='order-1 font-display text-xl font-bold tabular-nums text-white sm:text-3xl'>
        {display}
      </dd>
    </div>
  );
};

const SOCIALS = [
  { icon: Github, href: 'https://github.com/Aswincloud', label: 'GitHub' },
  { icon: Linkedin, href: 'https://www.linkedin.com/in/aswin4122001/', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:contact@aswincloud.com', label: 'Email' },
];

const HeroSection = React.memo(function HeroSection() {
  const experience = useExperienceCalculator();
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const { createRipple } = useRipple();
  const contactButtonRef = useRef(null);
  // Trigger the stat count-up once the strip is on screen (triggerOnce so it
  // never re-runs on scroll-back). On first paint the hero is already in view,
  // so it fires right after mount.
  const [statsRef, statsInView] = useInView({ triggerOnce: true, threshold: 0.4 });

  const handleScrollIndicator = React.useCallback(() => {
    setShowScrollIndicator(window.scrollY <= 50);
  }, []);
  useThrottledScroll(handleScrollIndicator);

  // On mobile the Chatwoot launcher is hidden while the hero is on screen (it
  // would float over the stat strip), so this button is the top-of-page entry
  // point to live chat. Open the panel directly; if the SDK is blocked or still
  // loading, fall back to the contact form so the action is never a dead end.
  const openLiveChat = React.useCallback(e => {
    if (window.$chatwoot?.toggle) {
      e.preventDefault();
      try {
        window.$chatwoot.toggle('open');
      } catch {
        window.location.hash = '#contact';
      }
    }
    // else: no SDK yet — let the <a href="#contact"> default fire.
  }, []);

  const stats = [
    { value: experience || '—', label: 'Experience' },
    { value: '5+', label: 'Shipped projects' },
    { value: '10+', label: 'Self-hosted services' },
  ];

  return (
    <section id='home' className='relative flex min-h-dvh flex-col overflow-hidden'>
      <AnimatedMeshGradient />

      {/* Content is centered in the space below the fixed nav. `my-auto`
          (rather than justify-center) centers when there's room but lets the
          block grow past the fold on very short viewports without clipping the
          top or bottom — a rare short screen scrolls instead of cutting off.
          The fixed chat launcher is hidden while this hero is on screen (see
          useChatVisibility), so the stat strip can sit in the corner freely. */}
      <div className='container-custom relative z-10 flex flex-1 flex-col pb-3 pt-16'>
        <div className='mx-auto my-auto max-w-4xl text-center'>
          {/* Availability chip + role — one centered line, wraps only on the
              narrowest screens. */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='mb-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:mb-6 sm:gap-y-3'
          >
            <span className='inline-flex items-center gap-2.5 rounded-full border border-hairline bg-surface/60 px-4 py-1.5 backdrop-blur-sm'>
              <span className='relative flex h-2 w-2'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75' />
                <span className='relative inline-flex h-2 w-2 rounded-full bg-brand-400' />
              </span>
              <span className='font-mono text-xs tracking-wide text-slate-300'>
                Available for interesting problems
              </span>
            </span>

            {/* text-brand-300 explicitly: `eyebrow` carries no colour, and this
                one has no SectionHeader to supply it. */}
            <span className='eyebrow text-brand-300'>Software Engineer · Pondicherry, India</span>
          </motion.div>

          {/* Headline. No entrance animation, unlike everything around it: these
              two elements are already on screen before React runs, written into
              the static shell by scripts/vite-plugin-prerender-hero.js. Fading
              them in from opacity 0 made the headline visibly vanish and
              reappear at mount — measured at 645ms of flicker, which is worse
              than the animation was ever worth. The elements below this are not
              prerendered, so they still animate and the hero still assembles. */}
          <h1 className='text-balance text-4xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl'>
            {HEADLINE.map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br />}
                {line.before}
                {line.match && <span className='gradient-text-shimmer'>{line.match}</span>}
                {line.after}
              </React.Fragment>
            ))}
          </h1>

          {/* Sub copy — prerendered too, so likewise unanimated. */}
          <p className='mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-slate-400 sm:mt-5 sm:text-lg'>
            {INTRO.before}
            {INTRO.match && <span className='font-semibold text-slate-200'>{INTRO.match}</span>}
            {INTRO.after}
          </p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className='mt-6 flex flex-col items-center justify-center gap-3 sm:mt-7 sm:flex-row'
          >
            <motion.a
              ref={contactButtonRef}
              href='#contact'
              onClick={e => createRipple(e, contactButtonRef.current)}
              whileHover={buttonMotion.hover}
              whileTap={buttonMotion.tap}
              className='group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-brand-500 to-cyan-500 px-7 py-3.5 font-semibold text-ink shadow-lg shadow-brand-500/20 transition-shadow hover:shadow-xl hover:shadow-brand-500/30 sm:w-auto'
            >
              <Mail size={18} />
              <span>Get in touch</span>
            </motion.a>

            {/* Résumé + Live chat share a two-up row on mobile; on desktop the
                wrapper dissolves (sm:contents) so Résumé sits inline and the
                Live chat button — redundant with the always-on desktop
                launcher — is hidden. */}
            <div className='grid w-full grid-cols-2 gap-3 sm:contents'>
              <motion.a
                href={RESUME_URL}
                target='_blank'
                rel='noopener noreferrer'
                whileHover={buttonMotion.hover}
                whileTap={buttonMotion.tap}
                className='group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-surface/60 px-5 py-3.5 font-semibold text-slate-200 backdrop-blur-sm transition-colors hover:border-slate-600 hover:bg-surface sm:w-auto sm:px-7'
                aria-label='View résumé (opens in a new tab)'
              >
                <FileText size={18} />
                <span>Résumé</span>
                <ArrowRight
                  size={16}
                  className='hidden transition-transform duration-200 group-hover:translate-x-0.5 sm:inline'
                />
              </motion.a>

              <motion.a
                href='#contact'
                onClick={openLiveChat}
                whileHover={buttonMotion.hover}
                whileTap={buttonMotion.tap}
                className='group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-surface/60 px-5 py-3.5 font-semibold text-slate-200 backdrop-blur-sm transition-colors hover:border-brand-500/40 hover:bg-surface hover:text-brand-200 sm:hidden'
                aria-label='Open live chat'
              >
                <MessageCircle size={18} />
                <span>Live chat</span>
              </motion.a>
            </div>
          </motion.div>

          {/* Socials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className='mt-4 flex items-center justify-center gap-3 sm:mt-5'
          >
            {SOCIALS.map((social, i) => (
              <motion.a
                key={social.label}
                href={social.href}
                target='_blank'
                rel='noopener noreferrer'
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.06 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                className='flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-surface/60 text-slate-400 backdrop-blur-sm transition-colors hover:border-brand-500/40 hover:text-brand-300'
                aria-label={`Visit ${social.label} profile`}
              >
                <social.icon size={20} />
              </motion.a>
            ))}
          </motion.div>
        </div>

        {/* Stat strip */}
        <motion.dl
          ref={statsRef}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className='mx-auto mt-5 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:mt-7'
        >
          {stats.map(stat => (
            <StatCell key={stat.label} value={stat.value} label={stat.label} start={statsInView} />
          ))}
        </motion.dl>

        <TechMarquee />
      </div>

      {/* Scroll indicator — a flow child pinned to the bottom of the hero
          column, so it always sits just above the fold. */}
      <motion.a
        href='#about'
        aria-label='Scroll to about section'
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollIndicator ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className='relative z-10 mx-auto hidden shrink-0 flex-col items-center gap-1 pb-4 pt-3 text-slate-500 transition-colors hover:text-slate-300 md:flex'
      >
        <span className='font-mono text-[10px] uppercase tracking-[0.2em]'>Scroll</span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown size={16} />
        </motion.span>
      </motion.a>
    </section>
  );
});

export default HeroSection;
