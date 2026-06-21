/**
 * @file ProjectsSection.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Featured projects section component with interactive cards and expandable content
 */

import React, { useState, useId, useRef } from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import {
  Sparkles,
  Code,
  Star,
  GitPullRequest,
  ExternalLink,
  ChevronDown,
  Circle,
  Github,
  Package,
} from 'lucide-react';
import { featuredProjects, allProjects } from '../../data/projects.jsx';
import { useRipple } from '../../hooks';

// Project Card
const ProjectCard = ({ project, index, inView }) => {
  return (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className='group relative h-full'
    >
      {/* Card */}
      <div className='relative h-full bg-white rounded-3xl p-8 lg:p-10 border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden'>
        {/* One subtle indigo→sky wash on hover — the single decorative layer. */}
        <div className='absolute inset-0 bg-linear-to-br from-secondary-500/[0.03] to-accent-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>

        <div className='relative z-10 flex flex-col'>
          {/* Project Icon and Title */}
          <div className='text-center'>
            <div className='flex items-center justify-center mb-6'>
              <div className='p-4 bg-linear-to-br from-secondary-500 to-accent-500 rounded-2xl text-white shadow-md group-hover:shadow-lg transition-shadow duration-300'>
                {project.icon}
              </div>
            </div>

            <h3 className='text-2xl lg:text-3xl font-bold text-gray-900 mb-3 text-center group-hover:text-secondary-600 transition-colors duration-300'>
              {project.title}
            </h3>

            <div className='flex items-center justify-center space-x-3 mb-6'>
              <span className='text-sm text-gray-500 font-medium'>{project.domain}</span>
              <div className='flex items-center space-x-1'>
                <Circle size={8} className='text-green-500 fill-current' />
                <span className='px-3 py-1 bg-linear-to-r from-green-100 to-emerald-100 text-green-800 text-xs font-bold rounded-full border border-green-200'>
                  {project.status}
                </span>
              </div>
            </div>

            <div className='flex flex-col items-center gap-4 mb-8'>
              <a
                href={project.link}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={`Visit ${project.title} project`}
                className='relative inline-flex items-center px-8 py-4 bg-linear-to-r from-secondary-500 via-accent-500 to-secondary-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 group/button overflow-hidden'
              >
                <ExternalLink
                  size={20}
                  className='mr-2 group-hover/button:rotate-3 transition-transform duration-300'
                />
                View Project
                <div className='absolute inset-0 bg-linear-to-r from-white/5 via-white/10 to-white/5 rounded-2xl opacity-0 group-hover/button:opacity-100 transition-opacity duration-300'></div>
                <div className='absolute inset-0 bg-linear-to-br from-transparent via-secondary-300/20 to-accent-300/20 rounded-2xl opacity-0 group-hover/button:opacity-100 transition-opacity duration-500'></div>
              </a>

              {(project.repo || project.pypi) && (
                <div className='flex flex-wrap items-center justify-center gap-3'>
                  {project.repo && (
                    <a
                      href={project.repo}
                      target='_blank'
                      rel='noopener noreferrer'
                      aria-label={`${project.title} source code on GitHub`}
                      className='inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:border-secondary-300 hover:text-secondary-600 hover:shadow-xs transition-all duration-200'
                    >
                      <Github size={16} />
                      Source
                    </a>
                  )}
                  {project.pypi && (
                    <a
                      href={project.pypi}
                      target='_blank'
                      rel='noopener noreferrer'
                      aria-label={`${project.title} package on PyPI`}
                      className='inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:border-secondary-300 hover:text-secondary-600 hover:shadow-xs transition-all duration-200'
                    >
                      <Package size={16} />
                      PyPI
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Project Details */}
          <div>
            <p className='text-gray-700 text-lg leading-relaxed mb-8 font-medium'>
              {project.description}
            </p>

            {/* Technologies */}
            <div className='mb-8'>
              <h4 className='text-xl font-bold text-gray-900 mb-4 flex items-center'>
                <div className='p-2 bg-linear-to-br from-secondary-500 to-accent-500 rounded-lg mr-3'>
                  <Code size={18} className='text-white' />
                </div>
                Technologies
              </h4>
              <div className='flex flex-wrap gap-3'>
                {project.technologies.map((tech, techIndex) => (
                  <motion.span
                    key={techIndex}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.3, delay: index * 0.05 + techIndex * 0.02 }}
                    className='px-4 py-2 bg-linear-to-r from-secondary-100 to-accent-100 text-secondary-800 text-sm font-bold rounded-full border border-secondary-200 hover:shadow-md transition-shadow duration-200'
                  >
                    {tech}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Key Features */}
            <div>
              <h4 className='text-xl font-bold text-gray-900 mb-4 flex items-center'>
                <div className='p-2 bg-linear-to-br from-emerald-500 to-teal-500 rounded-lg mr-3'>
                  <Star size={18} className='text-white' />
                </div>
                Key Features
              </h4>
              <div className='grid grid-cols-1 gap-3'>
                {project.features.map((feature, featureIndex) => (
                  <motion.div
                    key={featureIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05 + featureIndex * 0.05,
                    }}
                    className='flex items-center space-x-3 p-3 bg-linear-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-xs transition-shadow duration-200'
                  >
                    <div className='p-1 bg-linear-to-br from-accent-500 to-emerald-500 rounded-full'>
                      <GitPullRequest size={14} className='text-white' />
                    </div>
                    <span className='text-gray-700 font-medium'>{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Projects Section Component
const ProjectsSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [showMoreProjects, setShowMoreProjects] = useState(false);
  const { createRipple } = useRipple();
  const viewMoreButtonRef = useRef(null);

  const id = useId();
  const projectsSectionListId = `projects-list-${id}`;

  const handleViewMoreClick = e => {
    createRipple(e, viewMoreButtonRef.current);
    setShowMoreProjects(!showMoreProjects);
  };

  return (
    <section
      id='projects'
      className='section-padding relative overflow-hidden transition-colors duration-300'
      ref={ref}
    >
      {/* Subtle background tint — section color without the decoration noise. */}
      <div className='absolute inset-0 bg-linear-to-br from-gray-50 via-white to-gray-100'></div>

      <div className='container-custom relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className='text-center mb-20'
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='inline-flex items-center space-x-2 bg-linear-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-sm rounded-full px-8 py-4 mb-8 border border-emerald-200/50'
          >
            <Sparkles size={18} className='text-emerald-500' />
            <span className='text-sm font-bold text-gray-700 uppercase tracking-wider'>
              Featured Work
            </span>
          </motion.div>

          <h2 className='text-5xl lg:text-6xl font-black mb-8 text-gray-900 leading-tight'>
            Featured <span className='text-accent-600'>Projects</span>
          </h2>
          <p className='text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed'>
            Innovative solutions powered by machine learning and cutting-edge technology
          </p>
        </motion.div>

        <div className='grid gap-8 lg:grid-cols-2' id={projectsSectionListId}>
          {(showMoreProjects ? allProjects : featuredProjects).map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} inView={inView} />
          ))}
        </div>

        {/* Enhanced View More/Less Projects Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className='text-center mt-16'
        >
          <button
            ref={viewMoreButtonRef}
            type='button'
            onClick={handleViewMoreClick}
            aria-expanded={showMoreProjects}
            aria-controls={projectsSectionListId}
            className='relative inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-secondary-500 to-accent-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 group/btn overflow-hidden'
            style={{ position: 'relative' }}
          >
            {showMoreProjects ? 'View Less Projects' : 'View More Projects'}
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-300 group-hover/btn:rotate-3 ${showMoreProjects ? 'rotate-180' : ''}`}
              aria-hidden='true'
            />
            <div className='absolute inset-0 bg-linear-to-r from-white/5 via-white/10 to-white/5 rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300'></div>
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectsSection;
