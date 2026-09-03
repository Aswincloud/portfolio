/**
 * @file ExperienceEntry.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Individual experience entry — dark timeline card with company
 *   logo, role, period, and a per-company accent.
 */

import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar, ChevronRight } from 'lucide-react';

// Per-company accent — subtle tint so the two roles are distinguishable
// without breaking the emerald/cyan system.
const getCompanyTheme = companyName => {
  if (companyName.includes('MulticoreWare')) {
    return { dot: 'bg-brand-400', ring: 'ring-brand-400/30', tag: 'text-brand-300' };
  }
  if (companyName.includes('Lenovo')) {
    return { dot: 'bg-cyan-400', ring: 'ring-cyan-400/30', tag: 'text-cyan-300' };
  }
  return { dot: 'bg-slate-400', ring: 'ring-slate-400/30', tag: 'text-slate-300' };
};

function ExperienceEntryComponent({
  period,
  title,
  company,
  location,
  logo,
  description,
  achievements = [],
  tech = [],
  experience,
  inView = false,
  delay = 0.1,
}) {
  const theme = React.useMemo(() => getCompanyTheme(company), [company]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay }}
      className='relative pl-9 md:pl-20'
    >
      {/* Timeline node — a solid ink disc masks the rail passing behind it, a
          colored ring gives the halo, and the dot is flex-centred inside so the
          two can never drift apart. Its centre (left + 10) sits on the rail:
          3+10=13 mobile, 15+10=25 desktop.

          Shown at every width. It used to be md:flex alongside an md:block
          rail, which meant the section's one visual device — the thing that
          makes it a timeline rather than a stack of cards — was missing on
          phones. The 36px indent it costs there is affordable: at 390px the
          card still gets 314px. */}
      <span
        aria-hidden='true'
        className={`absolute left-[3px] top-[30px] flex h-5 w-5 items-center justify-center rounded-full bg-ink ring-2 md:left-[15px] ${theme.ring}`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
      </span>

      <div className='group card-surface card-lift overflow-hidden p-6 md:p-8'>
        {/* Period */}
        <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-2 px-3 py-1'>
          <Calendar size={13} className={theme.tag} />
          <span className='font-mono text-xs text-slate-400'>{period}</span>
        </div>

        {/* Header */}
        <div className='flex items-start gap-4'>
          <div className='flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-hairline bg-white p-2'>
            <img
              src={logo}
              alt={`${company} logo`}
              width={48}
              height={48}
              loading='lazy'
              className='h-full w-full object-contain'
            />
          </div>
          <div className='min-w-0 flex-1'>
            <h3 className='text-xl font-bold text-white sm:text-2xl'>{title}</h3>
            {/* The city belongs to the employer, so it sits on the company line
                — "MulticoreWare · Chennai" — the way the résumé writes it. In its
                own row beside the tenure it read as where *I* am, which put
                "Chennai" here against "Pondicherry" in the hero and the About
                copy: two cities for one person, on one page. */}
            <p className='mt-0.5 flex flex-wrap items-baseline gap-x-2.5 font-medium'>
              <span className={theme.tag}>{company}</span>
              {/* The pin is the separator. A "·" before it looked right on one
                  line but led the line when the location wrapped at 390px. */}
              {location && (
                <span className='inline-flex items-center gap-1 text-sm font-normal text-slate-400'>
                  <MapPin size={13} aria-hidden='true' />
                  {location}
                </span>
              )}
            </p>
            <p className='mt-1.5 font-mono text-xs text-slate-400'>{experience}</p>
          </div>
        </div>

        {/* Lead */}
        <p className='mt-5 leading-relaxed text-slate-400'>{description}</p>

        {/* What the role actually involved. Bullets rather than a second
            paragraph: the prose version packed three distinct pieces of work
            into one block, and the specifics were the first thing a skimming
            reader lost. Markers use the per-company accent. */}
        {achievements.length > 0 && (
          <ul className='mt-5 space-y-2.5'>
            {achievements.map(item => (
              <li
                key={item}
                className='flex items-start gap-3 text-sm leading-relaxed text-slate-400'
              >
                <ChevronRight size={15} className={`mt-0.5 shrink-0 ${theme.tag}`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Tooling — same chip treatment as the project cards, so the two card
            grids read as one system rather than two. */}
        {tech.length > 0 && (
          <div className='mt-6 flex flex-wrap gap-2 border-t border-hairline pt-5'>
            {tech.map(t => (
              <span
                key={t}
                className='rounded-md border border-hairline bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-slate-300'
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const ExperienceEntry = React.memo(ExperienceEntryComponent);

export default ExperienceEntry;
