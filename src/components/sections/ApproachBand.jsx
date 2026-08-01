/**
 * @file ApproachBand.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description A short band between About and Experience pairing the tumbling
 *   cube with a line about how the work actually goes. Intentionally has no
 *   `id`: it's a visual breather, not a nav destination, so it stays out of the
 *   nav list, the scroll-spy list, and the sitemap.
 */

import React from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { TumblingCube } from '../background/index.js';

const ApproachBand = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    // canvas → ink bridges the two neighbours (About is bg-canvas, Experience
    // is bg-ink), so the band reads as a transition rather than a third colour.
    <section className='relative overflow-hidden section-seam bg-linear-to-b from-canvas to-ink py-20 lg:py-24'>
      <div className='absolute inset-0 grid-bg opacity-50' />

      <div className='container-custom relative z-10'>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          // The row is centred as a unit and the copy column is allowed to
          // grow, so the pair sits optically centred instead of hugging the
          // left gutter. px-8 on the stage keeps its drop-shadow clear of the
          // section's overflow-hidden.
          className='mx-auto flex max-w-3xl flex-col items-center gap-10 md:flex-row md:gap-14'
        >
          <div className='shrink-0 px-8'>
            <TumblingCube />
          </div>

          <div className='text-center md:text-left'>
            <p className='eyebrow mb-5'>Approach</p>
            <h2 className='text-3xl font-bold leading-tight sm:text-4xl'>
              Always <span className='gradient-text'>turning it over</span>
            </h2>
            <p className='mt-4 text-lg leading-relaxed text-slate-400'>
              Measure, twist, measure again. Performance work is mostly patience — trying the next
              rotation until the whole thing lines up.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ApproachBand;
