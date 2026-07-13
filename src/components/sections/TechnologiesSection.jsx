/**
 * @file TechnologiesSection.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Technologies & platforms — dark category panels covering the
 *   cloud, OS, networking, and infrastructure stack.
 */

import React from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { Cloud, Monitor, Wifi, Server } from 'lucide-react';

const TECHNOLOGIES = [
  {
    category: 'Cloud Platforms',
    icon: Cloud,
    items: [
      { name: 'Microsoft Azure', description: 'Cloud computing services and solutions' },
      { name: 'Cloudflare', description: 'CDN, DNS, and edge computing platform' },
      { name: 'Vercel', description: 'Frontend deployment and hosting platform' },
      { name: 'Koyeb', description: 'Serverless deployment platform' },
    ],
  },
  {
    category: 'Operating Systems',
    icon: Monitor,
    items: [
      { name: 'Ubuntu', description: 'Linux server administration and development' },
      { name: 'Windows', description: 'Desktop and server environments' },
      { name: 'macOS', description: 'Apple ecosystem development and administration' },
      { name: 'Android', description: 'Mobile development and customization' },
    ],
  },
  {
    category: 'Networking & Security',
    icon: Wifi,
    items: [
      { name: 'Tailscale', description: 'Zero-config VPN and mesh networking' },
      { name: 'VPN', description: 'Virtual Private Network setup and management' },
      { name: 'OpenWrt', description: 'Open-source router firmware and networking' },
      { name: 'Network Administration', description: 'Network infrastructure and protocols' },
    ],
  },
  {
    category: 'Infrastructure',
    icon: Server,
    items: [
      { name: 'VPS Management', description: 'Virtual Private Server setup and maintenance' },
      { name: 'Server Administration', description: 'Server deployment and management' },
      { name: 'Infrastructure as Code', description: 'Automated infrastructure deployment' },
      { name: 'DevOps Practices', description: 'CI/CD and deployment automation' },
    ],
  },
];

const TechnologiesSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id='technologies' className='section-padding relative overflow-hidden bg-canvas'>
      <div className='container-custom relative z-10'>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className='mb-14 max-w-2xl'
        >
          <p className='eyebrow mb-5'>
            <span className='text-slate-600'>05 /</span> Stack
          </p>
          <h2 className='text-4xl font-bold sm:text-5xl'>
            Technologies &amp; <span className='gradient-text'>platforms</span>
          </h2>
          <p className='mt-4 text-lg leading-relaxed text-slate-400'>
            The tools I use to build, ship, and run things — across cloud, OS, networking, and
            infrastructure.
          </p>
        </motion.div>

        <div className='grid gap-5 md:grid-cols-2'>
          {TECHNOLOGIES.map((cat, catIndex) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: catIndex * 0.1 }}
                className='card-surface p-6 lg:p-8'
              >
                <div className='mb-6 flex items-center gap-3'>
                  <span className='flex h-11 w-11 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-brand-300'>
                    <Icon size={20} />
                  </span>
                  <h3 className='text-lg font-semibold text-white'>{cat.category}</h3>
                </div>

                <ul className='space-y-1'>
                  {cat.items.map((item, itemIndex) => (
                    <motion.li
                      key={item.name}
                      initial={{ opacity: 0, x: -12 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: catIndex * 0.1 + itemIndex * 0.05 }}
                      className='group flex items-baseline gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-2'
                    >
                      <span className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600 transition-colors group-hover:bg-brand-400' />
                      <div className='min-w-0'>
                        <span className='font-medium text-slate-200'>{item.name}</span>
                        <span className='ml-2 text-sm text-slate-500'>{item.description}</span>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className='relative mt-8 overflow-hidden rounded-2xl border border-brand-500/20 bg-linear-to-r from-brand-500/10 via-surface to-cyan-500/10 p-8 text-center'
        >
          <h3 className='text-xl font-bold text-white'>Always learning</h3>
          <p className='mx-auto mt-2 max-w-2xl leading-relaxed text-slate-400'>
            I&apos;m constantly exploring new technologies and platforms to stay current and expand
            what I can build across different domains.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default TechnologiesSection;
