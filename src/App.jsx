/**
 * @file App.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Main application component with routing and modular architecture
 */

import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import Navigation from './components/Navigation.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import {
  HeroSection,
  AboutSection,
  ApproachBand,
  ExperienceSection,
  SkillsSection,
  ProjectsSection,
  TechnologiesSection,
  ContactSection,
  Footer,
} from './components/sections';
import { initAnalytics } from './utils/analytics.js';
import {
  ErrorBoundary,
  SectionErrorBoundary,
  GlobalErrorHandler,
} from './components/ErrorBoundary/';
import ScrollProgress from './components/ScrollProgress.jsx';

// Off-home routes are split into their own chunks — most visitors only ever
// see the home page, so the legal pages and 404 shouldn't ride in the
// first-paint bundle. They load on demand when their route is hit.
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy.jsx'));
const TermsConditions = lazy(() => import('./components/TermsConditions.jsx'));
const NotFound = lazy(() => import('./components/NotFound.jsx'));

const getBasename = () => import.meta.env.BASE_URL || '/';

const HomePage = () => {
  return (
    <div className='relative'>
      <SectionErrorBoundary sectionName='Hero'>
        <HeroSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName='About'>
        <AboutSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName='Approach'>
        <ApproachBand />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName='Experience'>
        <ExperienceSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName='Skills'>
        <SkillsSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName='Projects'>
        <ProjectsSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName='Technologies'>
        <TechnologiesSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName='Contact'>
        <ContactSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName='Footer'>
        <Footer />
      </SectionErrorBoundary>
    </div>
  );
};

const LEGAL_ROUTES = ['/privacy', '/terms'];

// Chatwoot SDK is loaded async from index.html. There's a window where
// window.$chatwoot exists but the bubble DOM hasn't been created yet — calling
// toggleBubbleVisibility there throws on null.classList inside the SDK. So we
// gate on both the global AND the bubble element, and swallow any race that
// slips through with try/catch.
//
// Visibility policy:
//   • Legal routes (/privacy, /terms): always hidden.
//   • Home on mobile: hidden while the hero is in view, revealed once the user
//     scrolls past it. The launcher is fixed to the bottom-right and otherwise
//     floats over the hero stat strip in that corner; keeping the corner clear
//     (and letting the in-hero "Live chat" button be the entry point up top)
//     is cleaner than fighting it with padding.
//   • Everywhere else (home on desktop, 404): always shown.
const MOBILE_QUERY = '(max-width: 640px)';

const useChatVisibility = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const onHome = pathname === '/';

    const desiredState = () => {
      if (LEGAL_ROUTES.includes(pathname)) return 'hide';
      if (onHome && window.matchMedia(MOBILE_QUERY).matches) {
        const hero = document.getElementById('home');
        const threshold = hero ? hero.offsetHeight - 120 : window.innerHeight * 0.7;
        return window.scrollY > threshold ? 'show' : 'hide';
      }
      return 'show';
    };

    let applied = null;
    const apply = () => {
      if (!window.$chatwoot) return false;
      const bubble = document.querySelector('.woot-widget-bubble, #cw-bubble-holder');
      if (!bubble) return false;
      const want = desiredState();
      if (want !== applied) {
        try {
          window.$chatwoot.toggleBubbleVisibility(want);
          applied = want;
        } catch {
          return false;
        }
      }
      return true;
    };

    const ready = apply();

    // Only the home route needs to react to scroll/resize.
    let onScroll;
    if (onHome) {
      let raf = 0;
      onScroll = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          apply();
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
    }

    let onReady;
    if (!ready) {
      onReady = () => apply();
      window.addEventListener('chatwoot:ready', onReady);
    }

    return () => {
      if (onScroll) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
      if (onReady) window.removeEventListener('chatwoot:ready', onReady);
    };
  }, [pathname]);
};

// When we land on a hashed URL (e.g. /#projects from the 404 page, the footer,
// or an external link), the target section may not exist yet at the moment the
// hash is set. Wait for it via rAF, then scroll with the same 80px fixed-header
// offset used elsewhere. Pathname is a dependency so navigating away and back
// to the home route with a hash re-triggers the scroll.
const useHashScroll = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) return undefined;
    let raf = 0;
    const attempt = (tries = 0) => {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
      } else if (tries < 20) {
        raf = requestAnimationFrame(() => attempt(tries + 1));
      }
    };
    raf = requestAnimationFrame(() => attempt());
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash]);
};

const Layout = ({ children }) => {
  useChatVisibility();
  useHashScroll();

  return (
    <div className='min-h-screen bg-ink text-slate-300'>
      {/* Skip link — first focusable element on the page. Visually hidden until
          focused, then anchors keyboard/screen-reader users straight to the
          main content, past the nav. Pairs with the <main id> landmark below. */}
      <a
        href='#main-content'
        className='sr-only rounded-lg bg-brand-500 px-4 py-2 font-medium text-ink focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[100]'
      >
        Skip to content
      </a>

      <ScrollProgress />

      <ErrorBoundary level='component' fallbackComponent='Navigation'>
        <Navigation />
      </ErrorBoundary>

      <main id='main-content'>{children}</main>
    </div>
  );
};

// Main App Component with Routing
const App = () => {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    // reducedMotion="user" makes every motion/react component respect the OS
    // "reduce motion" setting — animations render instantly for users who asked
    // for it (the CSS media query only covers CSS animations, not the JS-driven
    // ones). Outermost so even the ErrorBoundary fallback UI inherits it.
    <MotionConfig reducedMotion='user'>
      <GlobalErrorHandler>
        <ErrorBoundary level='app' fallbackComponent='Portfolio Application'>
          <Router
            basename={getBasename()}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Layout>
              <Suspense
                fallback={<LoadingSpinner size='lg' text='Loading…' className='min-h-screen' />}
              >
                <Routes>
                  <Route path='/' element={<HomePage />} />
                  <Route
                    path='/privacy'
                    element={
                      <ErrorBoundary level='page' fallbackComponent='Privacy Policy'>
                        <PrivacyPolicy />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path='/terms'
                    element={
                      <ErrorBoundary level='page' fallbackComponent='Terms & Conditions'>
                        <TermsConditions />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path='*'
                    element={
                      <ErrorBoundary level='page' fallbackComponent='404 Page'>
                        <NotFound />
                      </ErrorBoundary>
                    }
                  />
                </Routes>
              </Suspense>
            </Layout>
          </Router>
        </ErrorBoundary>
      </GlobalErrorHandler>
    </MotionConfig>
  );
};

export default App;
