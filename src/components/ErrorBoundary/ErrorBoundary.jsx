/**
 * @file ErrorBoundary.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Enhanced error boundary with analytics logging and sophisticated fallback UI
 */

/* eslint-disable no-undef */
import React from 'react';
import { motion } from 'motion/react';
import {
  RefreshCw,
  AlertTriangle,
  Home,
  Copy,
  Bug,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

// Error analytics service
class ErrorAnalytics {
  static logError(error, errorInfo, context = {}) {
    const errorData = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      context,
      errorType: error.name,
      severity: this.calculateSeverity(error),
    };

    // Log to multiple services
    this.logToConsole(errorData);
    this.logToLocalStorage(errorData);
    this.logToAnalytics(errorData);
  }

  static logToConsole(errorData) {
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', errorData.message);
    console.error('Stack:', errorData.stack);
    console.error('Component Stack:', errorData.componentStack);
    console.error('Full Error Data:', errorData);
    console.groupEnd();
  }

  static logToLocalStorage(errorData) {
    try {
      const errors = JSON.parse(localStorage.getItem('portfolio_errors') || '[]');
      errors.push(errorData);

      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }

      localStorage.setItem('portfolio_errors', JSON.stringify(errors));
    } catch (e) {
      console.warn('Failed to log error to localStorage:', e);
    }
  }

  static logToAnalytics(errorData) {
    // Google Analytics 4 error tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: errorData.message,
        fatal: errorData.severity === 'fatal',
        custom_map: {
          error_type: errorData.errorType,
          error_severity: errorData.severity,
          error_context: JSON.stringify(errorData.context),
        },
      });
    }

    // Custom analytics endpoint (if available)
    if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      }).catch(e => console.warn('Failed to send error to analytics:', e));
    }
  }

  static getUserId() {
    return localStorage.getItem('portfolio_user_id') || 'anonymous';
  }

  static getSessionId() {
    let sessionId = sessionStorage.getItem('portfolio_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('portfolio_session_id', sessionId);
    }
    return sessionId;
  }

  static calculateSeverity(error) {
    if (error.name === 'ChunkLoadError') return 'warning';
    if (error.message.includes('Network')) return 'warning';
    if (error.message.includes('Loading')) return 'warning';
    return 'error';
  }
}

// Enhanced Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRetrying: false,
      showDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2),
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log error with context
    ErrorAnalytics.logError(error, errorInfo, {
      component: this.props.fallbackComponent || 'Unknown',
      retryCount: this.state.retryCount,
      timestamp: Date.now(),
      props: this.props.context || {},
    });
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true });

    // Simulate loading time for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1,
      isRetrying: false,
      showDetails: false,
    }));
  };

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = async () => {
    const errorText = `
Error ID: ${this.state.errorId}
Message: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (e) {
      console.warn('Failed to copy error to clipboard:', e);
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId, isRetrying, showDetails, copied } = this.state;
      const { level = 'component', fallbackComponent = 'Component' } = this.props;

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4'
        >
          <div className='max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden'>
            {/* Header */}
            <div className='bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white'>
              <div className='flex items-center space-x-4'>
                <div className='p-3 bg-white/20 rounded-full'>
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h1 className='text-2xl font-bold'>Oops! Something went wrong</h1>
                  <p className='text-red-100 mt-1'>
                    {level === 'app' ? 'Application Error' : `${fallbackComponent} Error`}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className='p-8'>
              <div className='text-center mb-8'>
                <div className='inline-flex items-center space-x-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium mb-4'>
                  <Bug size={16} />
                  <span>Error ID: {errorId}</span>
                </div>

                <p className='text-gray-600 text-lg leading-relaxed'>
                  We encountered an unexpected error. This has been automatically logged and our
                  team has been notified. You can try refreshing the page or returning to the
                  homepage.
                </p>
              </div>

              {/* Action Buttons */}
              <div className='flex flex-col sm:flex-row gap-4 mb-8'>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  className='flex-1 flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50'
                >
                  <RefreshCw size={20} className={isRetrying ? 'animate-spin' : ''} />
                  <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={this.handleGoHome}
                  className='flex-1 flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200'
                >
                  <Home size={20} />
                  <span>Go Home</span>
                </motion.button>
              </div>

              {/* Secondary Actions */}
              <div className='flex flex-col sm:flex-row gap-4 mb-8'>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={this.handleRefresh}
                  className='flex-1 flex items-center justify-center space-x-3 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors'
                >
                  <RefreshCw size={18} />
                  <span>Refresh Page</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={this.handleCopyError}
                  className='flex-1 flex items-center justify-center space-x-3 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors'
                >
                  {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                  <span>{copied ? 'Copied!' : 'Copy Error'}</span>
                </motion.button>
              </div>

              {/* Error Details Toggle */}
              <div className='border-t pt-6'>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => this.setState({ showDetails: !showDetails })}
                  className='flex items-center justify-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors mx-auto'
                >
                  <Bug size={16} />
                  <span>{showDetails ? 'Hide' : 'Show'} Technical Details</span>
                </motion.button>

                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className='mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200'
                  >
                    <h3 className='font-semibold text-gray-800 mb-4'>Error Details</h3>
                    <div className='space-y-4 text-sm'>
                      <div>
                        <span className='font-medium text-gray-600'>Message:</span>
                        <p className='text-gray-800 font-mono bg-white p-2 rounded mt-1'>
                          {error?.message || 'Unknown error'}
                        </p>
                      </div>
                      <div>
                        <span className='font-medium text-gray-600'>Stack Trace:</span>
                        <pre className='text-gray-800 font-mono bg-white p-2 rounded mt-1 overflow-x-auto text-xs'>
                          {error?.stack || 'No stack trace available'}
                        </pre>
                      </div>
                      {errorInfo?.componentStack && (
                        <div>
                          <span className='font-medium text-gray-600'>Component Stack:</span>
                          <pre className='text-gray-800 font-mono bg-white p-2 rounded mt-1 overflow-x-auto text-xs'>
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Support Link */}
              <div className='text-center mt-8 pt-6 border-t'>
                <p className='text-gray-500 text-sm mb-3'>
                  If this issue persists, please contact support
                </p>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href='mailto:contact@aswincloud.com'
                  className='inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium'
                >
                  <ExternalLink size={16} />
                  <span>contact@aswincloud.com</span>
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
