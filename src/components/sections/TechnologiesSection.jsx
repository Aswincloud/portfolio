/**
 * @file TechnologiesSection.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Technologies and platforms section component showcasing technical stack
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { Cloud, Monitor, Wifi, Server } from 'lucide-react';

// Technologies & Platforms Section Component
const TechnologiesSection = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const technologies = [
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

  return (
    <section id='technologies' className='section-padding relative overflow-hidden'>
      {/* Subtle background tint — section color without the decoration noise. */}
      <div className='absolute inset-0 bg-linear-to-br from-indigo-50 via-purple-50 to-indigo-50'></div>

      <div className='container-custom relative z-10'>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className='text-center mb-16'
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.1 }}
            className='inline-flex items-center space-x-2 bg-linear-to-r from-indigo-500/10 to-purple-500/10 rounded-full px-6 py-3 mb-6 backdrop-blur-sm border border-indigo-200/50'
          >
            <Monitor size={16} className='text-indigo-500' />
            <span className='text-sm font-semibold text-gray-600 uppercase tracking-wide'>
              Technical Stack
            </span>
          </motion.div>

          <h2 className='text-4xl md:text-5xl font-black mb-6 text-gray-900'>
            <span className='bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent'>
              Technologies & Platforms
            </span>
          </h2>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed'>
            Comprehensive experience across cloud platforms, operating systems, networking, and
            infrastructure technologies.
          </p>
        </motion.div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          {technologies.map((category, categoryIndex) => {
            const IconComponent = category.icon;
            return (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                className='group relative'
                onMouseEnter={() => setHoveredCategory(categoryIndex)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                {/* Glassmorphism Card */}
                <div className='relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden'>
                  {/* Animated Background Gradient */}
                  <div className='absolute inset-0 bg-linear-to-br from-indigo-500/5 via-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>

                  {/* Floating Orbs */}
                  <div className='absolute -top-16 -right-16 w-32 h-32 bg-linear-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
                  <div className='absolute -bottom-16 -left-16 w-24 h-24 bg-linear-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700'></div>

                  {/* Category Header */}
                  <div className='relative z-10 mb-6'>
                    <motion.div
                      animate={hoveredCategory === categoryIndex ? { scale: 1.02 } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className='flex items-center mb-4'
                    >
                      <div className='relative p-3 bg-linear-to-br from-indigo-500 to-purple-500 rounded-2xl text-white shadow-lg mr-4'>
                        <IconComponent className='w-6 h-6' />
                        <div className='absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200'></div>
                      </div>
                      <h3 className='text-2xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors duration-200'>
                        {category.category}
                      </h3>
                    </motion.div>
                  </div>

                  {/* Technology Items */}
                  <div className='space-y-3 relative z-10'>
                    {category.items.map((item, itemIndex) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{
                          duration: 0.4,
                          delay: categoryIndex * 0.1 + itemIndex * 0.05,
                        }}
                        className='flex items-start space-x-4 p-4 rounded-2xl bg-linear-to-r from-white/80 to-gray-50/80 border border-gray-100/50 hover:shadow-md transition-all duration-200 backdrop-blur-sm'
                      >
                        <div className='shrink-0 w-10 h-10 bg-linear-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center border border-indigo-200/50'>
                          <IconComponent className='w-5 h-5 text-indigo-600' />
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-bold text-gray-900 mb-1'>{item.name}</h4>
                          <p className='text-sm text-gray-600 leading-relaxed'>
                            {item.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className='text-center mt-12'
        >
          <div className='relative bg-linear-to-r from-indigo-500 to-purple-500 p-8 rounded-3xl text-white shadow-xl overflow-hidden'>
            {/* Background Pattern */}
            <div className='absolute inset-0 bg-white/10 rounded-3xl'></div>
            <div className='absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl'></div>
            <div className='absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl'></div>

            <div className='relative z-10'>
              <h3 className='text-2xl font-bold mb-4'>Continuous Learning</h3>
              <p className='text-lg opacity-90 max-w-2xl mx-auto'>
                I'm constantly exploring new technologies and platforms to stay current with
                industry trends and expand my technical capabilities across different domains.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TechnologiesSection;
