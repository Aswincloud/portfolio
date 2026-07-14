/**
 * @file ExperienceEntry.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Individual experience entry — dark timeline card with company
 *   logo, role, period, and a per-company accent.
 */

import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar } from 'lucide-react';

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
      className='relative pl-0 md:pl-20'
    >
      {/* Timeline node (desktop) — a solid ink disc masks the rail passing
          behind it, a colored ring gives the halo, and the dot is flex-centred
          inside so the two can never drift apart. Its centre (left 15 + 10)
          sits on the rail at left-[25px]. */}
      <span
        aria-hidden='true'
        className={`absolute left-[15px] top-[30px] hidden h-5 w-5 items-center justify-center rounded-full bg-ink ring-2 md:flex ${theme.ring}`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
      </span>

      <div className='group card-surface overflow-hidden p-6 transition-colors duration-300 hover:border-slate-600 md:p-8'>
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
            <p className={`mt-0.5 font-medium ${theme.tag}`}>{company}</p>
            <div className='mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500'>
              {location && (
                <span className='inline-flex items-center gap-1.5'>
                  <MapPin size={13} />
                  {location}
                </span>
              )}
              <span className='font-mono text-xs text-slate-500'>{experience}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className='mt-5 leading-relaxed text-slate-400'>{description}</p>
      </div>
    </motion.div>
  );
}

const ExperienceEntry = React.memo(ExperienceEntryComponent);

export default ExperienceEntry;
