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
import SectionHeader from '../SectionHeader.jsx';
import { sectionAccent } from '../../data/sectionAccents.js';
import {
  Cloud,
  Monitor,
  Wifi,
  Code2,
  CloudCog,
  Server,
  Workflow,
  AppWindow,
  ShieldCheck,
  Network,
} from 'lucide-react';
import {
  Python,
  ReactMark,
  NodeJs,
  Pytest,
  TailwindCss,
  Cloudflare,
  Vercel,
  Koyeb,
  Ubuntu,
  Apple,
  Android,
  Tailscale,
  OpenWrt,
} from '../icons/TechIcons.jsx';

// Each item carries its own mark so the list reads as a recognisable stack
// rather than eighteen identical bullets. Products get their real logo; the
// entries that are disciplines rather than products (server admin, DevOps, VPN,
// network admin) get a generic lucide glyph, as do Azure and Windows — see the
// header note in TechIcons.jsx for why those two have no brand mark.
const TECHNOLOGIES = [
  {
    category: 'Languages & Frameworks',
    icon: Code2,
    items: [
      { name: 'Python', description: 'Tooling, automation, and data/ML work', icon: Python },
      { name: 'React', description: 'Component-driven UIs and dashboards', icon: ReactMark },
      { name: 'Node.js', description: 'APIs, serverless functions, and tooling', icon: NodeJs },
      { name: 'pytest', description: 'Test automation and profiling harnesses', icon: Pytest },
      {
        name: 'Tailwind CSS',
        description: 'Design systems and responsive styling',
        icon: TailwindCss,
      },
    ],
  },
  {
    category: 'Cloud & Infrastructure',
    icon: Cloud,
    items: [
      { name: 'Cloudflare', description: 'CDN, DNS, Workers, and edge compute', icon: Cloudflare },
      {
        name: 'Microsoft Azure',
        description: 'Cloud computing services and solutions',
        icon: CloudCog,
      },
      { name: 'Vercel', description: 'Frontend and preview deployments', icon: Vercel },
      { name: 'Koyeb', description: 'Serverless app and API hosting', icon: Koyeb },
      {
        name: 'VPS & Server Admin',
        description: 'Self-hosting, setup, and maintenance',
        icon: Server,
      },
      { name: 'DevOps & IaC', description: 'CI/CD and automated infrastructure', icon: Workflow },
    ],
  },
  {
    category: 'Operating Systems',
    icon: Monitor,
    items: [
      {
        name: 'Ubuntu',
        description: 'Linux server administration and development',
        icon: Ubuntu,
      },
      { name: 'Windows', description: 'Desktop and server environments', icon: AppWindow },
      {
        name: 'macOS',
        description: 'Apple ecosystem development and administration',
        icon: Apple,
      },
      { name: 'Android', description: 'Mobile development and customization', icon: Android },
    ],
  },
  {
    category: 'Networking & Security',
    icon: Wifi,
    items: [
      { name: 'Tailscale', description: 'Zero-config VPN and mesh networking', icon: Tailscale },
      {
        name: 'VPN',
        description: 'Virtual Private Network setup and management',
        icon: ShieldCheck,
      },
      {
        name: 'OpenWrt',
        description: 'Open-source router firmware and networking',
        icon: OpenWrt,
      },
      {
        name: 'Network Administration',
        description: 'Network infrastructure and protocols',
        icon: Network,
      },
    ],
  },
];

const TOTAL_TECHNOLOGIES = TECHNOLOGIES.reduce((n, cat) => n + cat.items.length, 0);

const TechnologiesSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section
      id='technologies'
      className={`section-padding relative overflow-hidden ${sectionAccent('indigo')} bg-canvas`}
    >
      <div className='container-custom relative z-10'>
        <SectionHeader
          innerRef={ref}
          inView={inView}
          number='05'
          label='Stack'
          accent='indigo'
          title={
            <>
              Technologies &amp; <span className='gradient-text'>platforms</span>
            </>
          }
        >
          <p className='mt-4 text-lg leading-relaxed text-slate-400'>
            The tools I use to build, ship, and run things — from languages and frameworks to cloud,
            OS, networking, and infrastructure.
          </p>
        </SectionHeader>

        <div className='grid gap-5 md:grid-cols-2'>
          {TECHNOLOGIES.map((cat, catIndex) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: catIndex * 0.1 }}
                className='card-surface card-lift p-6 lg:p-8'
              >
                <div className='mb-6 flex items-center gap-3'>
                  {/* Indigo, matching this section's accent. These four tiles
                      were the last brand-emerald left in a section that is
                      otherwise indigo, and being the largest coloured element
                      on screen here they were reading as the section's hue —
                      arguing with the seam and the eyebrow rather than
                      supporting them. */}
                  <span className='flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300'>
                    <Icon size={20} />
                  </span>
                  <h3 className='text-lg font-semibold text-white'>{cat.category}</h3>
                </div>

                <ul className='space-y-1'>
                  {cat.items.map((item, itemIndex) => {
                    const ItemIcon = item.icon;
                    return (
                      <motion.li
                        key={item.name}
                        initial={{ opacity: 0, x: -12 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.4, delay: catIndex * 0.1 + itemIndex * 0.05 }}
                        className='group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-2'
                      >
                        {/* Fixed 20px slot so the text column stays aligned
                            regardless of each mark's aspect ratio, and so the
                            filled brand logos and the stroked lucide fallbacks
                            share one optical centre. Monochrome → the section's
                            indigo on hover, exactly what the plain dot used to
                            do: eighteen full-colour logos would fight the
                            section accent instead of supporting it. */}
                        <span className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-slate-500 transition-colors group-hover:text-indigo-300'>
                          <ItemIcon size={16} />
                        </span>
                        <div className='min-w-0'>
                          <span className='font-medium text-slate-200'>{item.name}</span>
                          <span className='ml-2 text-sm text-slate-400'>{item.description}</span>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className='relative mt-8 overflow-hidden rounded-2xl border border-indigo-500/20 bg-linear-to-r from-indigo-500/10 via-surface to-cyan-500/10 p-8 text-center'
        >
          <h3 className='text-xl font-bold text-white'>Learned by shipping</h3>
          {/* The count is derived rather than written down so it can't drift out
              of date when the lists above change. The previous copy here made no
              claim at all ("constantly exploring new technologies to stay
              current"), which read as filler next to sections that quote real
              numbers — so this points at the evidence instead. */}
          <p className='mx-auto mt-2 max-w-2xl leading-relaxed text-slate-400'>
            All {TOTAL_TECHNOLOGIES} of these are here because I&apos;ve put something into
            production with it — a published package, a service I run, or the site you&apos;re
            reading. The list grows when a real problem needs a tool I don&apos;t have yet.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default TechnologiesSection;
