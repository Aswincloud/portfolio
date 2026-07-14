/**
 * @file SkillsSection.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Skills — dark card grid of core competencies.
 */

import React from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { Code, Zap, Cpu, Cloud } from 'lucide-react';

const SKILLS = [
  {
    icon: <Code size={22} />,
    title: 'Software Development',
    description:
      'Designing for clarity and change — readable code, sensible architecture, and interfaces that age well.',
    tint: 'text-brand-300 border-brand-500/20 bg-brand-500/10',
  },
  {
    icon: <Zap size={22} />,
    title: 'Performance Optimization',
    description:
      'Measure before touching anything, find the real bottleneck, and prove the win with numbers.',
    tint: 'text-cyan-300 border-cyan-500/20 bg-cyan-500/10',
  },
  {
    icon: <Cpu size={22} />,
    title: 'System Analysis',
    description:
      'Reasoning about how the pieces actually behave under load — where time goes and why it stalls.',
    tint: 'text-indigo-300 border-indigo-500/20 bg-indigo-500/10',
  },
  {
    icon: <Cloud size={22} />,
    title: 'Cloud & Infrastructure',
    description:
      'Shipping and running services end to end — owning deploys, uptime, and the pager that comes with them.',
    tint: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10',
  },
];

const SkillsSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section
      id='skills'
      className='section-padding relative overflow-hidden section-seam bg-canvas'
    >
      <div className='container-custom relative z-10'>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className='mb-14 max-w-2xl'
        >
          <p className='eyebrow mb-5'>
            <span className='text-slate-600'>03 /</span> Skills
          </p>
          <h2 className='text-4xl font-bold sm:text-5xl'>
            What I do <span className='gradient-text'>best</span>
          </h2>
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
        </motion.div>

        <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
          {SKILLS.map((skill, i) => (
            <motion.div
              key={skill.title}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className='group card-surface p-6 transition-colors duration-300 hover:border-slate-600 hover:bg-surface-2'
            >
              <span
                className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105 ${skill.tint}`}
              >
                {skill.icon}
              </span>
              <h3 className='text-lg font-semibold text-white'>{skill.title}</h3>
              <p className='mt-2 text-sm leading-relaxed text-slate-400'>{skill.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
