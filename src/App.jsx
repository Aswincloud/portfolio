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
const useChatVisibility = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const apply = () => {
      if (!window.$chatwoot) return false;
      const bubble = document.querySelector('.woot-widget-bubble, #cw-bubble-holder');
      if (!bubble) return false;
      try {
        window.$chatwoot.toggleBubbleVisibility(LEGAL_ROUTES.includes(pathname) ? 'hide' : 'show');
        return true;
      } catch {
        return false;
      }
    };

    if (apply()) return undefined;

    const onReady = () => apply();
    window.addEventListener('chatwoot:ready', onReady);
    return () => window.removeEventListener('chatwoot:ready', onReady);
  }, [pathname]);
};

const Layout = ({ children }) => {
  useChatVisibility();

  return (
    <div className='min-h-screen bg-white text-gray-900'>
      <ScrollProgress />

      <ErrorBoundary level='component' fallbackComponent='Navigation'>
        <Navigation />
      </ErrorBoundary>

      {children}
    </div>
  );
};

// Main App Component with Routing
const App = () => {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <GlobalErrorHandler>
      <ErrorBoundary level='app' fallbackComponent='Portfolio Application'>
        {/* reducedMotion="user" makes every motion component respect the OS
            "reduce motion" setting — animations are stripped to instant for
            users who asked for it (the CSS media query only covers CSS
            animations, not Framer Motion's JS-driven ones). */}
        <MotionConfig reducedMotion='user'>
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
        </MotionConfig>
      </ErrorBoundary>
    </GlobalErrorHandler>
  );
};

export default App;
