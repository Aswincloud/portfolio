/**
 * @file SkillsSection.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Modern skills section component showcasing technical expertise and capabilities
 */

import React from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { Code, Zap, Cpu, Cloud, Sparkles } from 'lucide-react';

// Modern Skills Section Component
const SkillsSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const skills = [
    {
      icon: <Code size={48} />,
      title: 'Software Development',
      description: 'Full-stack development, application architecture, and software engineering',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
    },
    {
      icon: <Zap size={48} />,
      title: 'Performance Optimization',
      description: 'Profiling, benchmarking, and performance analysis for applications',
      color: 'from-secondary-500 to-secondary-700',
      bgColor: 'from-secondary-50 to-indigo-100',
    },
    {
      icon: <Cpu size={48} />,
      title: 'System Analysis',
      description: 'System profiling, resource optimization, and performance tuning',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50',
    },
    {
      icon: <Cloud size={48} />,
      title: 'Cloud Technologies',
      description: 'Cloud deployment, infrastructure, and modern deployment strategies',
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50',
    },
  ];

  return (
    <section id='skills' className='section-padding bg-white relative overflow-hidden'>
      {/* Subtle background tint — section color without the decoration noise. */}
      <div className='absolute inset-0 bg-linear-to-br from-white via-secondary-50/50 to-accent-50/50'></div>

      <div className='container-custom relative z-10'>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className='text-center mb-16'
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='inline-flex items-center space-x-2 bg-linear-to-r from-secondary-500/10 to-accent-500/10 rounded-full px-6 py-3 mb-6 backdrop-blur-sm border border-secondary-200/30'
          >
            <Sparkles size={16} className='text-secondary-500' />
            <span className='text-sm font-semibold text-gray-600 uppercase tracking-wide'>
              Skills & Expertise
            </span>
          </motion.div>

          <h2 className='text-4xl lg:text-5xl font-bold mb-6 text-gray-900'>
            What I Do <span className='text-accent-600'>Best</span>
          </h2>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed'>
            Passionate about technologies that drive innovation and create meaningful impact
          </p>
        </motion.div>

        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
          {skills.map((skill, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className='group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-gray-100 overflow-hidden'
            >
              {/* Simplified background gradient overlay */}
              <div
                className={`absolute inset-0 bg-linear-to-br ${skill.bgColor} opacity-0 group-hover:opacity-80 transition-opacity duration-300`}
              ></div>

              {/* Optimized floating background elements */}
              <div className='absolute -top-4 -right-4 w-12 h-12 bg-linear-to-br from-gray-200/15 to-gray-300/15 rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-200'></div>
              <div className='absolute -bottom-4 -left-4 w-8 h-8 bg-linear-to-br from-gray-100/20 to-gray-200/20 rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-200'></div>

              {/* Icon container */}
              <div
                className={`relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br ${skill.color} mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                {skill.icon}
              </div>

              {/* Content */}
              <div className='relative z-10'>
                <h3 className='text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors duration-300'>
                  {skill.title}
                </h3>
                <p className='text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300'>
                  {skill.description}
                </p>
              </div>

              {/* Simplified decorative corner element */}
              <div className='absolute top-4 right-4 w-2 h-2 bg-gray-300 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-300'></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
