/**
 * @file usePageTransitions.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Tracks which section is currently on screen, and scrolls to one
 *   on demand. Consumed by Navigation.jsx to light the active nav item.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Every section the nav can point at, in document order. ApproachBand is
// deliberately absent: it has no id and is not a nav destination.
const SECTIONS = ['home', 'about', 'experience', 'skills', 'projects', 'technologies', 'contact'];

// Matches `scroll-padding-top` in index.css (and the same constant in App.jsx's
// useHashScroll), so a nav click, a hashed URL, and a native hash jump all land
// in the same place. Change one, change all three.
const HEADER_OFFSET = 80;

/**
 * One IntersectionObserver decides the active section.
 *
 * This used to be three mechanisms computing the same value — the observer, a
 * scroll handler that called getBoundingClientRect on all seven sections, and a
 * mount-time pass doing it once more. The two rect-based passes were measured
 * at 34 forced layouts over a single scroll of the page and agreed with the
 * observer anyway, so they were removed rather than throttled.
 */
export const usePageTransitions = () => {
  const [currentSection, setCurrentSection] = useState('home');
  // Last known ratio per section, surviving across callbacks. The observer only
  // reports sections whose visibility *changed*, so picking the winner from one
  // callback's entries alone would let a section that is merely still on screen
  // lose to whichever one happened to tick — the active item then sticks on a
  // tall section. Keeping every ratio makes the comparison global.
  const ratios = useRef(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          ratios.current.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        let best = null;
        let bestRatio = 0;
        for (const [id, ratio] of ratios.current) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        }
        if (best) setCurrentSection(best);
      },
      {
        rootMargin: `-${HEADER_OFFSET}px 0px -${HEADER_OFFSET}px 0px`,
        // Enough steps that a tall section's ratio still changes as it scrolls,
        // which is what keeps the comparison above meaningful.
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    // rAF so the sections exist: this runs on Navigation's mount, which is
    // before the route's sections have painted.
    const raf = requestAnimationFrame(() => {
      for (const id of SECTIONS) {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      }
    });

    const snapshot = ratios.current;
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      snapshot.clear();
    };
  }, []);

  const navigateToSection = useCallback(sectionId => {
    const element = document.getElementById(sectionId);
    if (!element) return;
    // Set it immediately rather than waiting for the observer, so the nav
    // responds on click instead of part-way through the smooth scroll.
    setCurrentSection(sectionId);
    window.scrollTo({ top: element.offsetTop - HEADER_OFFSET, behavior: 'smooth' });
  }, []);

  return { currentSection, navigateToSection };
};

export default usePageTransitions;
