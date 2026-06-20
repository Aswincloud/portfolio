/**
 * @file PageTransition.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Page transition system with Framer Motion for smooth animations
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { pageTransitionVariants, staggerVariants } from './pageTransitionVariants';

// Page transition component
const PageTransition = ({ children, variant = 'fadeIn', className = '', delay = 0, ...props }) => {
  const transition = pageTransitionVariants[variant] || pageTransitionVariants.fadeIn;

  return (
    <motion.div
      initial={transition.initial}
      animate={transition.animate}
      exit={transition.exit}
      transition={{
        ...transition.transition,
        delay: delay,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Section transition component with intersection observer
export const SectionTransition = ({
  children,
  variant = 'slideUp',
  className = '',
  threshold = 0.1,
  triggerOnce = true,
  ...props
}) => {
  const transition = pageTransitionVariants[variant] || pageTransitionVariants.slideUp;

  return (
    <motion.div
      initial={transition.initial}
      whileInView={transition.animate}
      exit={transition.exit}
      transition={transition.transition}
      viewport={{ once: triggerOnce, amount: threshold }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Staggered animation component
export const StaggeredTransition = ({
  children,
  className = '',
  staggerDelay = 0.1,
  delay = 0.2,
  ...props
}) => {
  return (
    <motion.div
      variants={staggerVariants.container}
      initial='initial'
      whileInView='animate'
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        staggerChildren: staggerDelay,
        delayChildren: delay,
      }}
      className={className}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={staggerVariants.item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Route transition wrapper
export const RouteTransition = ({ children, location }) => {
  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={location}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Smooth scroll transition
export const ScrollTransition = ({
  children,
  className = '',
  offset = 100,
  duration = 0.6,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Custom transition component
export const CustomTransition = ({
  children,
  initial = { opacity: 0 },
  animate = { opacity: 1 },
  exit = { opacity: 0 },
  transition = { duration: 0.5 },
  className = '',
  ...props
}) => {
  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
