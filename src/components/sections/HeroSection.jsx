/**
 * @file HeroSection.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Hero section component with animated background and CTAs
 */

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Github, Linkedin, Mail, Briefcase, ArrowRight } from 'lucide-react';
import { useExperienceCalculator, useThrottledScroll, useRipple } from '../../hooks';
import { AnimatedMeshGradient } from '../background';
import { useMicroInteractions } from '../../utils/microInteractions';

const HeroSection = React.memo(function HeroSection() {
  const experience = useExperienceCalculator();
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const { variants } = useMicroInteractions();
  const { createRipple } = useRipple();
  const contactButtonRef = useRef(null);
  const workButtonRef = useRef(null);

  const handleScrollIndicator = React.useCallback(() => {
    setShowScrollIndicator(window.scrollY <= 50);
  }, []);

  useThrottledScroll(handleScrollIndicator);

  const handleContactClick = e => {
    createRipple(e, contactButtonRef.current);
  };

  const handleWorkClick = e => {
    createRipple(e, workButtonRef.current);
  };

  return (
    <section
      id='home'
      className='min-h-screen flex items-center justify-center relative overflow-hidden pt-16 md:pt-0'
    >
      <AnimatedMeshGradient />

      <div className='absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-slate-900 to-transparent pointer-events-none'></div>

      <div className='container-custom relative z-10'>
        <div className='flex items-center justify-center'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='text-white text-center max-w-5xl'
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='flex items-center justify-center space-x-2 mb-4'
            >
              <span className='text-2xl'>👋</span>
              <span className='text-xl font-medium text-gray-300'>Hello, I'm</span>
            </motion.div>

            <motion.h1
              className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className='bg-linear-to-r from-secondary-400 to-accent-400 bg-clip-text text-transparent'>
                Aswin
              </span>
            </motion.h1>

            <motion.p
              className='text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-4 md:mb-6 font-semibold text-gray-100'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Software Engineer
            </motion.p>

            <motion.p
              className='text-base sm:text-lg md:text-xl mb-6 md:mb-8 text-gray-300 leading-relaxed max-w-3xl mx-auto px-4 sm:px-0'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              I make AI accelerators go faster. At MulticoreWare I profile, benchmark, and optimize
              the software that runs on next-generation AI hardware. Based in Pondicherry, with{' '}
              {experience} of professional experience.
            </motion.p>

            <motion.div
              className='flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8 justify-center px-4 sm:px-0 hero-buttons'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.a
                ref={contactButtonRef}
                href='#contact'
                onClick={handleContactClick}
                whileHover={variants.buttonHover}
                whileTap={variants.buttonTap}
                className='group relative px-8 py-4 bg-linear-to-r from-secondary-500 to-accent-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:shadow-secondary-500/20 transition-shadow duration-300 overflow-hidden'
                aria-label='Navigate to contact section'
              >
                <span className='relative z-10 flex items-center justify-center space-x-2'>
                  <Mail size={20} />
                  <span>Get In Touch</span>
                </span>
              </motion.a>

              <motion.a
                ref={workButtonRef}
                href='#experience'
                onClick={handleWorkClick}
                whileHover={variants.buttonHover}
                whileTap={variants.buttonTap}
                className='group relative px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-colors duration-300 overflow-hidden'
                aria-label='Navigate to experience section'
              >
                <span className='flex items-center justify-center space-x-2'>
                  <Briefcase size={20} />
                  <span>View My Work</span>
                  <ArrowRight
                    size={18}
                    className='transition-transform duration-200 group-hover:translate-x-1'
                  />
                </span>
              </motion.a>
            </motion.div>

            <motion.div
              className='flex items-center gap-4 md:gap-6 justify-center mb-8 md:mb-16 px-4 sm:px-0'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {[
                { icon: Github, href: 'https://github.com/Aswincloud', label: 'GitHub' },
                {
                  icon: Linkedin,
                  href: 'https://www.linkedin.com/in/aswin4122001/',
                  label: 'LinkedIn',
                },
                { icon: Mail, href: 'mailto:contact@aswincloud.com', label: 'Email' },
              ].map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.08 }}
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className='group relative p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-colors duration-300'
                  aria-label={`Visit ${social.label} profile`}
                >
                  <social.icon
                    size={24}
                    className='text-white group-hover:text-accent-300 transition-colors duration-300'
                  />
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollIndicator ? 1 : 0 }}
        transition={{ delay: showScrollIndicator ? 1 : 0, duration: 0.4 }}
        className='absolute bottom-12 md:bottom-8 left-1/2 transform -translate-x-1/2 z-40'
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className='flex flex-col items-center space-y-2 text-white/80'
        >
          <span className='text-sm font-medium'>Scroll to explore</span>
          <div className='w-6 h-10 border-2 border-white/50 rounded-full flex justify-center'>
            <motion.div
              className='w-1 h-3 bg-white/80 rounded-full mt-2'
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
});

export default HeroSection;
