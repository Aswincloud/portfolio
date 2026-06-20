/**
 * @file microInteractions.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Utility functions for micro-interactions and subtle animations
 */

// Ripple effect for buttons
export const createRipple = (event, element) => {
  const ripple = document.createElement('span');
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    transform: scale(0);
    animation: ripple-effect 0.6s linear;
    background-color: rgba(255, 255, 255, 0.6);
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    pointer-events: none;
    z-index: 1000;
  `;

  // Add ripple keyframes if not already added
  if (!document.head.querySelector('#ripple-keyframes')) {
    const style = document.createElement('style');
    style.id = 'ripple-keyframes';
    style.textContent = `
      @keyframes ripple-effect {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  element.appendChild(ripple);
  setTimeout(() => {
    ripple.remove();
  }, 600);
};

// Motion (motion/react) variants for common micro-interactions
export const microInteractionVariants = {
  // Button interactions
  buttonHover: {
    scale: 1.02,
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },
  buttonTap: {
    scale: 0.98,
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },
  buttonPrimary: {
    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
    transition: { duration: 0.2 },
  },

  // Card interactions
  cardHover: {
    y: -8,
    scale: 1.02,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  cardTap: {
    scale: 0.98,
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },

  // Link interactions
  linkHover: {
    scale: 1.05,
    color: '#667eea',
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },

  // Icon interactions
  iconHover: {
    scale: 1.1,
    rotate: 5,
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },
  iconTap: {
    scale: 0.95,
    rotate: -5,
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },

  // Input interactions
  inputFocus: {
    scale: 1.02,
    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },

  // Loading states
  loading: {
    opacity: [1, 0.6, 1],
    transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' },
  },

  // Stagger animations
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.05,
      },
    },
  },
  staggerChild: {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
  },
};

// Utility function to add subtle shake animation
export const addShakeAnimation = element => {
  element.style.animation = 'shake 0.5s ease-in-out';
  setTimeout(() => {
    element.style.animation = '';
  }, 500);

  // Add shake keyframes if not already added
  if (!document.head.querySelector('#shake-keyframes')) {
    const style = document.createElement('style');
    style.id = 'shake-keyframes';
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
    `;
    document.head.appendChild(style);
  }
};

// Utility function to add pulse animation
export const addPulseAnimation = (element, duration = 1000) => {
  element.style.animation = `pulse ${duration}ms ease-in-out`;
  setTimeout(() => {
    element.style.animation = '';
  }, duration);

  // Add pulse keyframes if not already added
  if (!document.head.querySelector('#pulse-keyframes')) {
    const style = document.createElement('style');
    style.id = 'pulse-keyframes';
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);
  }
};

// Utility function for magnetic effect on hover
export const addMagneticEffect = (element, strength = 0.3) => {
  const handleMouseMove = e => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    element.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const handleMouseLeave = () => {
    element.style.transform = 'translate(0px, 0px)';
    element.style.transition = 'transform 0.3s ease';
    setTimeout(() => {
      element.style.transition = '';
    }, 300);
  };

  element.addEventListener('mousemove', handleMouseMove);
  element.addEventListener('mouseleave', handleMouseLeave);

  // Return cleanup function
  return () => {
    element.removeEventListener('mousemove', handleMouseMove);
    element.removeEventListener('mouseleave', handleMouseLeave);
  };
};

// Utility function for tilt effect
export const addTiltEffect = (element, maxTilt = 15) => {
  const handleMouseMove = e => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * maxTilt;
    const rotateY = ((centerX - x) / centerX) * maxTilt;

    element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    element.style.transition = 'transform 0.3s ease';
    setTimeout(() => {
      element.style.transition = '';
    }, 300);
  };

  element.addEventListener('mousemove', handleMouseMove);
  element.addEventListener('mouseleave', handleMouseLeave);

  // Return cleanup function
  return () => {
    element.removeEventListener('mousemove', handleMouseMove);
    element.removeEventListener('mouseleave', handleMouseLeave);
  };
};

// Custom hook for micro-interactions (to be used in React components)
export const useMicroInteractions = () => {
  return {
    createRipple,
    addShakeAnimation,
    addPulseAnimation,
    addMagneticEffect,
    addTiltEffect,
    variants: microInteractionVariants,
  };
};
