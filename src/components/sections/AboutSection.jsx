/**
 * @file AboutSection.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description About section — dark editorial two-column with narrative copy
 *   and a focus-areas panel.
 */

import React from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { Cpu, Cloud, Gauge, Palette } from 'lucide-react';
import SectionHeader from '../SectionHeader.jsx';
import { sectionAccent } from '../../data/sectionAccents.js';

const PARAGRAPHS = [
  {
    body: (
      <>
        I&apos;m a <span className='font-semibold text-slate-100'>senior software engineer</span>{' '}
        based in Pondicherry, working at MulticoreWare on the software that runs on{' '}
        <span className='font-semibold text-slate-100'>AI accelerator hardware</span>. Most days
        that means profiling tensor operations, hunting bottlenecks, and turning benchmark numbers
        into something faster.
      </>
    ),
  },
  {
    body: (
      <>
        The work I enjoy lives close to the metal — where a data layout, a kernel choice, or a
        scheduling decision is the difference between fast and{' '}
        <span className='font-semibold text-slate-100'>genuinely fast</span>. I care about measuring
        before optimizing, and about making the optimization stick.
      </>
    ),
  },
  {
    body: (
      <>
        Off the clock, I run <span className='font-semibold text-slate-100'>my own cloud</span> —
        self-hosted services behind Cloudflare tunnels, from this site to a support desk to an AI
        chat. It&apos;s where I get to be the ops team, the security team, and the person who gets
        paged, all at once.
      </>
    ),
  },
];

const FOCUS = [
  {
    icon: <Gauge size={20} />,
    title: 'Profiling & benchmarking',
    desc: 'Measure first. Find the bottleneck. Prove the win with numbers.',
  },
  {
    icon: <Cpu size={20} />,
    title: 'Close-to-the-metal optimization',
    desc: 'Data layout, kernel choice, and scheduling on AI silicon.',
  },
  {
    icon: <Cloud size={20} />,
    title: 'Self-hosted infrastructure',
    desc: 'A personal cloud of services behind Cloudflare tunnels.',
  },
  {
    icon: <Palette size={20} />,
    title: 'Web design & development',
    desc: "Fast, modern, hand-built sites — like the one you're on.",
  },
];

const AboutSection = React.memo(() => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section
      id='about'
      className={`section-padding relative overflow-hidden ${sectionAccent('brand')} bg-canvas`}
    >
      <div className='container-custom relative z-10'>
        <div className='grid gap-14 lg:grid-cols-[1fr_0.85fr] lg:gap-20'>
          {/* Narrative */}
          <SectionHeader
            innerRef={ref}
            inView={inView}
            number='01'
            label='About'
            accent='brand'
            className=''
            size='major'
            title={
              <>
                Where software meets <span className='gradient-text'>silicon</span>
              </>
            }
          >
            {/* "Now" line — a live status echoing the hero's availability chip,
                so the page opens with a current, specific signal of what I'm on. */}
            <p className='mt-5 inline-flex items-center gap-2.5 font-mono text-sm text-slate-400'>
              <span className='relative flex h-2 w-2'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75' />
                <span className='relative inline-flex h-2 w-2 rounded-full bg-brand-400' />
              </span>
              <span>
                <span className='text-slate-400'>Currently</span> — profiling tensor ops on AI
                silicon at MulticoreWare
              </span>
            </p>

            <div className='mt-8 space-y-6 border-l border-hairline pl-6'>
              {PARAGRAPHS.map((p, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.15 + i * 0.12 }}
                  className='text-lg leading-relaxed text-slate-400'
                >
                  {p.body}
                </motion.p>
              ))}
            </div>
          </SectionHeader>

          {/* Focus areas */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className='flex flex-col gap-4 lg:pt-16'
          >
            {FOCUS.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className='group card-surface card-lift p-6'
              >
                <div className='flex items-start gap-4'>
                  <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-brand-300 transition-transform duration-300 group-hover:scale-105'>
                    {f.icon}
                  </span>
                  <div>
                    <h3 className='text-base font-semibold text-white'>{f.title}</h3>
                    <p className='mt-1 text-sm leading-relaxed text-slate-400'>{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
});

AboutSection.displayName = 'AboutSection';

export default AboutSection;
