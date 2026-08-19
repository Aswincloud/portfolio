/**
 * @file ProjectsSection.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Featured projects — dark cards with tech tags, feature lists,
 *   and repo / PyPI links; expandable to show all projects.
 */

import React, { useState, useId, useRef } from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import SectionHeader from '../SectionHeader.jsx';
import { sectionAccent } from '../../data/sectionAccents.js';
import { ExternalLink, ChevronDown, Package, Check } from 'lucide-react';
import { Github } from '../icons/BrandIcons.jsx';
import { featuredProjects, allProjects, PROJECT_KINDS } from '../../data/projects.jsx';
import { useRipple } from '../../hooks';

const ProjectCard = ({ project, index, inView }) => {
  const kind = PROJECT_KINDS[project.kind] ?? PROJECT_KINDS.web;

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: (index % 3) * 0.08 }}
      className='group relative flex h-full flex-col overflow-hidden card-surface card-lift p-7 lg:p-8'
    >
      {/* Accent edge, keyed to the project's kind — the same centre-weighted
          hairline the skills cards and the section seams use. */}
      <span
        aria-hidden='true'
        className={`absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent ${kind.edge}`}
      />

      {/* Top row: icon + status/metric. The status pill stays emerald on every
          card — it means "live", which doesn't vary by kind. The metric chip
          below it takes the accent instead. */}
      <div className='flex items-start justify-between gap-4'>
        {/* shrink-0: without it a long metric chip compresses the tile — the
            widest one used to leave it 35px of the 56px it asks for. */}
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-105 [&_svg]:h-7 [&_svg]:w-7 ${kind.tile}`}
        >
          {project.icon}
        </span>
        <div className='flex min-w-0 flex-col items-end gap-1.5'>
          <span className='inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 font-mono text-[11px] font-medium text-brand-300'>
            <span className='h-1.5 w-1.5 rounded-full bg-brand-400' />
            {project.status}
          </span>
          {project.metric && (
            <span
              className={`max-w-full truncate rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium ${kind.chip}`}
            >
              {project.metric}
            </span>
          )}
        </div>
      </div>

      {/* Title + domain */}
      <h3 className='mt-6 text-xl font-bold leading-snug text-white'>{project.title}</h3>
      <p className='mt-1 font-mono text-xs text-slate-400'>{project.domain}</p>

      {/* Description */}
      <p className='mt-4 leading-relaxed text-slate-400'>{project.description}</p>

      {/* Tech tags */}
      <div className='mt-6 flex flex-wrap gap-2'>
        {project.technologies.map(tech => (
          <span
            key={tech}
            className='rounded-md border border-hairline bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-slate-300'
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Features */}
      <ul className='mt-6 space-y-2.5'>
        {project.features.map(feature => (
          <li key={feature} className='flex items-start gap-2.5 text-sm text-slate-400'>
            <Check size={16} className='mt-0.5 shrink-0 text-brand-400' />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Links — pinned to bottom. Tight padding/gaps so a card with all
          three (View / Source / PyPI) still fits one row at 3-col width;
          flex-wrap remains a safety net on very narrow screens. */}
      <div className='mt-auto flex flex-wrap items-center gap-2 pt-7'>
        <a
          href={project.link}
          target='_blank'
          rel='noopener noreferrer'
          aria-label={`Visit ${project.title}`}
          className='group/btn inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-brand-500 to-cyan-500 px-3.5 py-2.5 text-sm font-semibold text-ink shadow-md shadow-brand-500/20 transition-shadow hover:shadow-lg hover:shadow-brand-500/30'
        >
          <ExternalLink size={15} />
          Visit
        </a>
        {project.repo && (
          <a
            href={project.repo}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={`${project.title} source on GitHub`}
            className='inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white'
          >
            <Github size={15} />
            Source
          </a>
        )}
        {project.pypi && (
          <a
            href={project.pypi}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={`${project.title} on PyPI`}
            className='inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white'
          >
            <Package size={15} />
            PyPI
          </a>
        )}
      </div>
    </motion.article>
  );
};

const ProjectsSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05 });
  const [showMore, setShowMore] = useState(false);
  const { createRipple } = useRipple();
  const btnRef = useRef(null);
  const listId = `projects-${useId()}`;

  const handleToggle = e => {
    createRipple(e, btnRef.current);
    setShowMore(v => !v);
  };

  // Keep the button under the pointer across a collapse.
  //
  // Expanding is fine: cards appear below the button and nothing moves under you.
  // Collapsing removes everything between the button and the viewport top, so the
  // button jumps upward by the height of the cards that just left — on a phone
  // that is several screens, and the control you just pressed ends up off-screen
  // above you with no indication that the list shrank rather than the page broke.
  //
  // Runs after the DOM has the new card count, and only on the collapse, so the
  // expand path stays a pure state change. `block: 'nearest'` scrolls the minimum
  // needed, which is nothing at all when the button is already in view.
  //
  // The mount guard is load-bearing: showMore is already false on the first run,
  // so without it every visitor would be scrolled down to this button on page
  // load — the section is most of a screen below the fold, and 'nearest' would
  // dutifully bring it into view.
  const hasToggled = useRef(false);
  React.useEffect(() => {
    if (!hasToggled.current) {
      hasToggled.current = true;
      return;
    }
    if (!showMore) btnRef.current?.scrollIntoView({ block: 'nearest' });
  }, [showMore]);

  return (
    <section
      id='projects'
      className={`section-padding relative overflow-hidden ${sectionAccent('cyan')} bg-ink`}
      ref={ref}
    >
      <div className='container-custom relative z-10'>
        <SectionHeader
          inView={inView}
          number='04'
          label='Projects'
          accent='cyan'
          title={<>Things I&apos;ve built</>}
        >
          <p className='mt-4 text-lg leading-relaxed text-slate-400'>
            Performance tooling, dashboards, and a few bots — most live on my own cloud.
          </p>
        </SectionHeader>

        <div id={listId} className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {(showMore ? allProjects : featuredProjects).map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} inView={inView} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className='mt-12 text-center'
        >
          <button
            ref={btnRef}
            type='button'
            onClick={handleToggle}
            aria-expanded={showMore}
            aria-controls={listId}
            className='relative inline-flex items-center gap-2 overflow-hidden rounded-xl border border-hairline bg-surface px-6 py-3 font-mono text-sm font-medium text-slate-200 transition-colors hover:border-brand-500/40 hover:text-white'
          >
            {showMore ? 'Show less' : 'Show all projects'}
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${showMore ? 'rotate-180' : ''}`}
              aria-hidden='true'
            />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectsSection;
