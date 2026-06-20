/**
 * @file usePageTransitions.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Custom hook for page transitions and smooth navigation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAnimation } from 'motion/react';

// Fast smooth scrolling function
const smoothScrollTo = element => {
  // Calculate target position accounting for fixed header
  const targetPosition = element.offsetTop - 80;

  // Use native smooth scrolling for instant response
  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth',
  });
};

// Custom hook for page transitions
export const usePageTransitions = () => {
  const [currentSection, setCurrentSection] = useState('home');
  const [scrollDirection, setScrollDirection] = useState('down');
  const controls = useAnimation();
  const lastScrollY = useRef(0);

  // Initialize current section on mount - detect based on scroll position
  useEffect(() => {
    const detectInitialSection = () => {
      const sections = [
        'home',
        'about',
        'experience',
        'skills',
        'projects',
        'technologies',
        'contact',
      ];
      const currentScrollY = window.scrollY;

      // If at the top, set to home
      if (currentScrollY < 100) {
        setCurrentSection('home');
        return;
      }

      // Find the section that contains the current scroll position
      for (let i = 0; i < sections.length; i++) {
        const element = document.getElementById(sections[i]);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top + currentScrollY;
          const elementBottom = elementTop + rect.height;

          if (currentScrollY >= elementTop - 200 && currentScrollY < elementBottom - 200) {
            setCurrentSection(sections[i]);
            return;
          }
        }
      }
    };

    // Detect initial section after a brief delay to ensure DOM is ready
    const timeoutId = setTimeout(detectInitialSection, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // Track scroll direction and current section as fallback
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrollDirection(currentScrollY > lastScrollY.current ? 'down' : 'up');
          lastScrollY.current = currentScrollY;

          // Fallback method to detect current section based on scroll position
          const sections = [
            'home',
            'about',
            'experience',
            'skills',
            'projects',
            'technologies',
            'contact',
          ];

          for (let i = 0; i < sections.length; i++) {
            const element = document.getElementById(sections[i]);
            if (element) {
              const rect = element.getBoundingClientRect();
              const elementTop = rect.top + currentScrollY;
              const elementBottom = elementTop + rect.height;

              // Check if current scroll position is within this section
              // Use a larger offset for the header
              if (currentScrollY >= elementTop - 200 && currentScrollY < elementBottom - 200) {
                setCurrentSection(sections[i]);
                break;
              }
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track current section - improved detection
  useEffect(() => {
    const sections = [
      'home',
      'about',
      'experience',
      'skills',
      'projects',
      'technologies',
      'contact',
    ];

    const observer = new IntersectionObserver(
      entries => {
        // Find the most visible section
        let mostVisibleSection = null;
        let maxIntersectionRatio = 0;

        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > maxIntersectionRatio) {
            maxIntersectionRatio = entry.intersectionRatio;
            mostVisibleSection = entry.target.id;
          }
        });

        // If we found a visible section, update current section
        if (mostVisibleSection) {
          setCurrentSection(mostVisibleSection);
        }
      },
      {
        rootMargin: '-80px 0px -80px 0px', // Account for fixed header
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      }
    );

    // Wait for DOM to be ready and observe sections
    const observeSections = () => {
      sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
          observer.observe(element);
        }
      });
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(observeSections);

    return () => observer.disconnect();
  }, []);

  // Smooth navigation with transitions
  const navigateToSection = useCallback(sectionId => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Immediately update current section for instant feedback
      setCurrentSection(sectionId);

      // Perform smooth scroll
      smoothScrollTo(element);
    }
  }, []);

  // Page load animation - simplified
  const startPageLoadAnimation = useCallback(() => {
    // No-op - keeping for backward compatibility
  }, []);

  // Smooth scroll to top
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  // Get next/previous section
  const getAdjacentSection = useCallback(
    direction => {
      const sections = [
        'home',
        'about',
        'experience',
        'skills',
        'projects',
        'technologies',
        'contact',
      ];
      const currentIndex = sections.indexOf(currentSection);

      if (direction === 'next' && currentIndex < sections.length - 1) {
        return sections[currentIndex + 1];
      } else if (direction === 'prev' && currentIndex > 0) {
        return sections[currentIndex - 1];
      }
      return null;
    },
    [currentSection]
  );

  // Navigate to next section
  const goToNextSection = useCallback(() => {
    const nextSection = getAdjacentSection('next');
    if (nextSection) {
      navigateToSection(nextSection);
    }
  }, [getAdjacentSection, navigateToSection]);

  // Navigate to previous section
  const goToPrevSection = useCallback(() => {
    const prevSection = getAdjacentSection('prev');
    if (prevSection) {
      navigateToSection(prevSection);
    }
  }, [getAdjacentSection, navigateToSection]);

  // Keyboard navigation (only for specific key combinations to avoid interfering with normal scrolling)
  useEffect(() => {
    const handleKeyDown = e => {
      // Only handle keyboard navigation if Ctrl/Cmd is pressed to avoid interfering with normal scrolling
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            goToNextSection();
            break;
          case 'ArrowUp':
            e.preventDefault();
            goToPrevSection();
            break;
          case 'Home':
            e.preventDefault();
            navigateToSection('home');
            break;
          case 'End':
            e.preventDefault();
            navigateToSection('contact');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextSection, goToPrevSection, navigateToSection]);

  return {
    // State
    currentSection,
    scrollDirection,

    // Controls
    controls,

    // Functions
    navigateToSection,
    startPageLoadAnimation,
    scrollToTop,
    goToNextSection,
    goToPrevSection,
    getAdjacentSection,
  };
};

// Hook for scroll-triggered animations
export const useScrollAnimations = () => {
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / scrollHeight) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const observeSection = useCallback(sectionId => {
    const element = document.getElementById(sectionId);
    if (!element) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, sectionId]));
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return {
    visibleSections,
    scrollProgress,
    observeSection,
  };
};

// Hook for staggered animations
export const useStaggeredAnimations = (itemCount, staggerDelay = 0.1) => {
  const controls = useAnimation();

  const startStaggeredAnimation = useCallback(async () => {
    await controls.start(i => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * staggerDelay,
        duration: 0.5,
        ease: 'easeOut',
      },
    }));
  }, [controls, staggerDelay]);

  const resetAnimation = useCallback(async () => {
    await controls.start({
      opacity: 0,
      y: 20,
      transition: { duration: 0 },
    });
  }, [controls]);

  return {
    controls,
    startStaggeredAnimation,
    resetAnimation,
  };
};

export default usePageTransitions;
