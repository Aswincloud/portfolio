/**
 * @file ExperienceSection.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Professional experience — dark timeline with dynamic tenure.
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { useExperienceCalculator } from '../../hooks';
import { getExperienceData } from '../../data/experienceData.js';
import ExperienceEntry from '../ExperienceEntry.jsx';

const ExperienceSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const experience = useExperienceCalculator();
  const experienceData = useMemo(() => getExperienceData(experience), [experience]);

  return (
    <section
      id='experience'
      className='section-padding relative overflow-hidden section-seam bg-ink'
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
            <span className='text-slate-600'>02 /</span> Experience
          </p>
          <h2 className='text-4xl font-bold sm:text-5xl'>Where I&apos;ve worked</h2>
          <p className='mt-4 text-lg leading-relaxed text-slate-400'>
            Building performance-critical software and shipping across hardware and cloud.
          </p>
        </motion.div>

        <div className='relative max-w-4xl'>
          {/* Timeline rail (desktop) */}
          <div className='absolute left-[25px] top-4 bottom-4 hidden w-px bg-linear-to-b from-brand-500/40 via-hairline to-transparent md:block' />

          <div className='space-y-6 md:space-y-8'>
            {experienceData.map(entry => (
              <ExperienceEntry
                key={`${entry.company}-${entry.period}`}
                {...entry}
                inView={inView}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
