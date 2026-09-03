/**
 * @file AboutSection.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description About section — dark editorial two-column with narrative copy
 *   and a focus-areas panel that carries its own evidence.
 *
 *   This panel absorbed the Skills section. The page used to cover the same four
 *   themes three times in a row — here as focus areas, again as Skills cards
 *   (Software Development / Performance / System Analysis / Cloud), then a third
 *   time as the Stack — and a reader skimming for what I do hit the same
 *   message three sections running. The Skills cards' one distinct asset was
 *   their `proof` lines, which grounded each claim in something that exists
 *   elsewhere on the site; those moved here, and the section went.
 */

import React from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { Cpu, Cloud, Gauge, Palette, ArrowRight } from 'lucide-react';
import SectionHeader from '../SectionHeader.jsx';
import { sectionAccent } from '../../data/sectionAccents.js';

// Each paragraph says something the hero did not. The first used to restate
// the headline ("the software that runs on AI accelerator hardware"), which
// with the hero, the Approach band, the experience card and the footer made
// five tellings of one sentence on one page.
const PARAGRAPHS = [
  {
    body: (
      <>
        I&apos;m a <span className='font-semibold text-slate-100'>senior software engineer</span>{' '}
        based in Pondicherry. At MulticoreWare I work on{' '}
        <span className='font-semibold text-slate-100'>Tenstorrent&apos;s TT-Metal stack</span>, and
        a typical day is a profiler trace, a table of kernel timings, and one question: where did
        the time go?
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
        Evenings go to <span className='font-semibold text-slate-100'>a personal cloud</span> —
        self-hosted services behind Cloudflare tunnels, from this site to a support desk to an AI
        chat. It&apos;s where I get to be the ops team, the security team, and the person who gets
        paged, all at once.
      </>
    ),
  },
];

// `proof` grounds each area in work that actually exists elsewhere on the site,
// so a claim is followed by evidence rather than a description. `tint`, `edge`
// and `dot` must stay literal class strings — Tailwind scans source text, so a
// class assembled at runtime would never be emitted.
const FOCUS = [
  {
    icon: <Gauge size={20} />,
    title: 'Profiling & benchmarking',
    desc: 'Measure first. Find the bottleneck. Prove the win with numbers.',
    tint: 'text-cyan-300 border-cyan-500/20 bg-cyan-500/10',
    edge: 'via-cyan-400/60',
    dot: 'bg-cyan-300',
    proof: [
      'ttperf — CLI profiler for device kernel timings, on PyPI',
      'TTNN eltwise tracker — regressions correlated back to the commit',
    ],
  },
  {
    icon: <Cpu size={20} />,
    title: 'Close-to-the-metal optimization',
    desc: 'Data layout, kernel choice, and scheduling on AI silicon.',
    tint: 'text-indigo-300 border-indigo-500/20 bg-indigo-500/10',
    edge: 'via-indigo-400/60',
    dot: 'bg-indigo-300',
    proof: [
      'Throughput work on TT-Metal tensor ops at MulticoreWare',
      'Bottlenecks traced across the stack before anything changes',
    ],
  },
  {
    icon: <Cloud size={20} />,
    title: 'Self-hosted infrastructure',
    desc: 'A personal cloud behind Cloudflare tunnels — deploys, uptime, and the pager.',
    tint: 'text-brand-300 border-brand-500/20 bg-brand-500/10',
    edge: 'via-brand-400/60',
    dot: 'bg-brand-300',
    proof: [
      'Live chat, support desk, résumé and dashboards, all self-hosted',
      'Edge deploys on Cloudflare Workers',
    ],
  },
  {
    icon: <Palette size={20} />,
    title: 'Web design & development',
    desc: "Fast, modern, hand-built sites — like the one you're on.",
    tint: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10',
    edge: 'via-emerald-400/60',
    dot: 'bg-emerald-300',
    proof: ['This site — hand-built design system, no UI kit', 'Lighthouse 96 / 100 / 100 / 100'],
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
        {/* lg:items-center: the focus column grew by four proof blocks when it
            absorbed Skills and is now taller than the narrative. Top-aligned,
            that left ~250px of empty column under the last paragraph; centred,
            the copy sits in the middle of the cards it describes. */}
        <div className='grid gap-14 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-20'>
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
                <span className='text-slate-400'>Currently</span> — performance engineering on
                TT-Metal at MulticoreWare
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

          {/* Focus areas, each with its evidence */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className='flex flex-col gap-4'
          >
            {FOCUS.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className='group card-surface card-lift relative overflow-hidden p-6'
              >
                {/* Accent edge — the same centre-weighted hairline as the
                    section seams and the project cards, recoloured per card. */}
                <span
                  aria-hidden='true'
                  className={`absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent ${f.edge}`}
                />
                <div className='flex items-start gap-4'>
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105 ${f.tint}`}
                  >
                    {f.icon}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <h3 className='text-base font-semibold text-white'>{f.title}</h3>
                    <p className='mt-1 text-sm leading-relaxed text-slate-400'>{f.desc}</p>
                    <ul className='mt-3 space-y-1.5 border-t border-hairline pt-3'>
                      {f.proof.map(line => (
                        <li
                          key={line}
                          className='flex items-start gap-2 font-mono text-[11px] leading-relaxed text-slate-400'
                        >
                          <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${f.dot}`} />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* The tools behind these live one section system away; this is the
                pointer the old Skills sub-copy used to carry. */}
            <a
              href='#technologies'
              className='group/link inline-flex w-fit items-center gap-1.5 self-end py-1.5 font-mono text-xs text-slate-400 transition-colors hover:text-brand-300'
            >
              The tools behind these — see the Stack
              <ArrowRight
                size={13}
                className='transition-transform duration-200 group-hover/link:translate-x-0.5'
              />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

AboutSection.displayName = 'AboutSection';

export default AboutSection;
