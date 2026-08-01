/**
 * @file ExperienceSection.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Professional experience — dark timeline with dynamic tenure.
 */

import React, { useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import SectionHeader from '../SectionHeader.jsx';
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
      className='section-padding relative overflow-hidden section-seam seam-cyan bg-ink'
    >
      <div className='container-custom relative z-10'>
        <SectionHeader
          innerRef={ref}
          inView={inView}
          number='02'
          label='Experience'
          accent='cyan'
          title={<>Where I&apos;ve worked</>}
        >
          <p className='mt-4 text-lg leading-relaxed text-slate-400'>
            Building performance-critical software and shipping across hardware and cloud.
          </p>
        </SectionHeader>

        <div className='relative max-w-4xl'>
          {/* Timeline rail. Aligned to the node centres in ExperienceEntry:
              left-[13px] mobile, left-[25px] desktop. Cyan head rather than the
              old brand-500 so it agrees with this section's accent. */}
          <div className='absolute left-[13px] top-4 bottom-4 w-px bg-linear-to-b from-cyan-500/40 via-hairline to-transparent md:left-[25px]' />

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
