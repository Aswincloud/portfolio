/**
 * @file SectionErrorBoundary.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Lightweight error boundary for section-level errors
 */

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw, SkipForward } from 'lucide-react';

// Section Error Fallback Component
const SectionErrorFallback = ({ errorId, onRetry, onSkip, sectionName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='section-padding bg-linear-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl'
    >
      <div className='container-custom'>
        <div className='text-center py-12'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6'>
            <AlertTriangle size={32} className='text-red-600' />
          </div>

          <h2 className='text-2xl font-bold text-gray-900 mb-2'>{sectionName} Section Error</h2>

          <p className='text-gray-600 mb-6 max-w-md mx-auto'>
            This section encountered an issue while loading. You can try reloading it or skip to the
            next section.
          </p>

          <div className='inline-flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium mb-8'>
            <span>Error ID: {errorId}</span>
          </div>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRetry}
              className='flex items-center justify-center space-x-2 bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200'
            >
              <RefreshCw size={18} />
              <span>Try Again</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSkip}
              className='flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors'
            >
              <SkipForward size={18} />
              <span>Skip Section</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Section Error Boundary Component
class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      isSkipped: false,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Log to console for debugging
    console.error(`Section Error in ${this.props.sectionName}:`, error);

    // Log to analytics if available
    if (import.meta.env.PROD && typeof gtag !== 'undefined') {
      // eslint-disable-next-line no-undef
      gtag('event', 'exception', {
        description: `Section Error: ${this.props.sectionName} - ${error.message}`,
        fatal: false,
        section: this.props.sectionName,
        error_boundary: 'section',
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      retryCount: prevState.retryCount + 1,
      isSkipped: false,
    }));
  };

  handleSkip = () => {
    this.setState({
      hasError: false,
      isSkipped: true,
    });
  };

  render() {
    if (this.state.hasError && !this.state.isSkipped) {
      return (
        <SectionErrorFallback
          errorId={Date.now().toString(36)}
          onRetry={this.handleRetry}
          onSkip={this.handleSkip}
          sectionName={this.props.sectionName || 'Unknown'}
        />
      );
    }

    if (this.state.isSkipped) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='section-padding bg-gray-50 border border-gray-200 rounded-xl'
        >
          <div className='container-custom'>
            <div className='text-center py-8'>
              <p className='text-gray-500'>
                {this.props.sectionName} section was skipped due to an error.
              </p>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
