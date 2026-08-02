/**
 * @file SkillsSection.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Skills — dark card grid of core competencies.
 */

import React from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import SectionHeader from '../SectionHeader.jsx';
import { sectionAccent } from '../../data/sectionAccents.js';
import { Code, Zap, Cpu, Cloud } from 'lucide-react';

// `proof` grounds each discipline in work that actually exists elsewhere on the
// site, so a claim is followed by evidence rather than empty card space. `edge`
// and `dot` must stay literal class strings — Tailwind scans source text, so a
// class assembled at runtime from `tint` would never be emitted.
const SKILLS = [
  {
    icon: <Code size={22} />,
    title: 'Software Development',
    description:
      'Designing for clarity and change — readable code, sensible architecture, and interfaces that age well.',
    tint: 'text-brand-300 border-brand-500/20 bg-brand-500/10',
    edge: 'via-brand-400/60',
    dot: 'bg-brand-300',
    proof: [
      'This site — hand-built design system, no UI kit',
      'ttperf — packaged and published to PyPI',
    ],
  },
  {
    icon: <Zap size={22} />,
    title: 'Performance Optimization',
    description:
      'Measure before touching anything, find the real bottleneck, and prove the win with numbers.',
    tint: 'text-cyan-300 border-cyan-500/20 bg-cyan-500/10',
    edge: 'via-cyan-400/60',
    dot: 'bg-cyan-300',
    proof: ['CLI profiler for device kernel timings', 'Day-by-day tracking against a baseline'],
  },
  {
    icon: <Cpu size={22} />,
    title: 'System Analysis',
    description:
      'Reasoning about how the pieces actually behave under load — where time goes and why it stalls.',
    tint: 'text-indigo-300 border-indigo-500/20 bg-indigo-500/10',
    edge: 'via-indigo-400/60',
    dot: 'bg-indigo-300',
    proof: [
      'Tensor op profiling on AI accelerator silicon',
      'Regressions correlated back to the commit',
    ],
  },
  {
    icon: <Cloud size={22} />,
    title: 'Cloud & Infrastructure',
    description:
      'Shipping and running services end to end — owning deploys, uptime, and the pager that comes with them.',
    tint: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10',
    edge: 'via-emerald-400/60',
    dot: 'bg-emerald-300',
    proof: ['A self-hosted cloud behind Cloudflare tunnels', 'Edge deploys on Cloudflare Workers'],
  },
];

const SkillsSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section
      id='skills'
      className={`section-padding relative overflow-hidden ${sectionAccent('indigo')} bg-canvas`}
    >
      <div className='container-custom relative z-10'>
        <SectionHeader
          innerRef={ref}
          inView={inView}
          number='03'
          label='Skills'
          accent='indigo'
          title={
            <>
              What I do <span className='gradient-text'>best</span>
            </>
          }
        >
          <p className='mt-4 text-lg leading-relaxed text-slate-400'>
            The disciplines I reach for when a system needs to be faster, leaner, or more reliable —
            the specific tools live in the{' '}
            <a
              href='#technologies'
              className='font-medium text-brand-300 underline decoration-brand-500/40 underline-offset-4 transition-colors hover:text-brand-200 hover:decoration-brand-400'
            >
              Stack
            </a>
            .
          </p>
        </SectionHeader>

        {/* Two across, not four. At `lg:grid-cols-4` each card was a 207px
            column, which put the body copy at ~26 characters a line — well under
            the 45–75 band where prose stays comfortable — and was narrow enough
            that "Performance Optimization" wrapped to two lines while its three
            neighbours didn't, leaving that one card's text 28px out of step. Two
            columns give ~62 characters and fit every title on one line. */}
        <div className='grid gap-5 md:grid-cols-2'>
          {SKILLS.map((skill, i) => (
            <motion.div
              key={skill.title}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className='group card-surface card-lift relative flex flex-col overflow-hidden p-6'
            >
              {/* Accent edge — the same centre-weighted hairline as
                  `section-seam`, recoloured per card. Gives each card its own
                  identity without four saturated backgrounds; the card's
                  overflow-hidden keeps it inside the rounded corners. */}
              <span
                aria-hidden='true'
                className={`absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent ${skill.edge}`}
              />

              <span
                className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105 ${skill.tint}`}
              >
                {skill.icon}
              </span>
              <h3 className='text-lg font-semibold text-white'>{skill.title}</h3>
              {/* mb-5 guarantees a gap even in the tallest card, where the
                  proof block's mt-auto collapses to zero. */}
              <p className='mb-5 mt-2 text-sm leading-relaxed text-slate-400'>
                {skill.description}
              </p>

              {/* Proof lines — the empty lower half of these cards was the whole
                  problem. Filling it with concrete work rather than a graphic
                  keeps the section content-first. `mt-auto` pins the block to
                  the bottom so all four line up despite uneven descriptions. */}
              <ul className='mt-auto space-y-2 border-t border-hairline pt-5'>
                {skill.proof.map(line => (
                  <li
                    key={line}
                    className='flex items-start gap-2 font-mono text-[11px] leading-relaxed text-slate-500'
                  >
                    <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${skill.dot}`} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
