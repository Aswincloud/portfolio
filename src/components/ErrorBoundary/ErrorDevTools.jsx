/**
 * @file ErrorDevTools.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Developer tools for error management and debugging
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bug,
  X,
  Trash2,
  Download,
  AlertTriangle,
  Info,
  AlertCircle,
  Zap,
  Eye,
  RefreshCw,
  Calendar,
  MapPin,
  User,
  Monitor,
} from 'lucide-react';
import { useErrorReporting, ERROR_SEVERITY } from '../../hooks';

// Development-only error tracking
const ErrorDevTools = () => {
  // Always call the hook (React requirement)
  const { clearErrorHistory, getErrorHistory, exportErrorHistory, errorStats } =
    useErrorReporting();

  const [errors, setErrors] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedError, setSelectedError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Only track errors in development mode
    if (import.meta.env.DEV) {
      const handleError = error => {
        setErrors(prev => [
          ...prev.slice(-9),
          {
            id: Date.now(),
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          },
        ]);
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', event => {
        handleError(new Error(event.reason));
      });

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleError);
      };
    }
  }, []);

  // Don't render anything in production
  if (!import.meta.env.DEV) {
    return null;
  }

  // Filter errors based on selected filter
  const filteredErrors = errors.filter(error => {
    if (filter === 'all') return true;
    return error.severity === filter;
  });

  // Get severity icon and color
  const getSeverityDisplay = severity => {
    const displays = {
      [ERROR_SEVERITY.INFO]: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100' },
      [ERROR_SEVERITY.WARNING]: {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        bg: 'bg-yellow-100',
      },
      [ERROR_SEVERITY.ERROR]: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100' },
      [ERROR_SEVERITY.FATAL]: { icon: Zap, color: 'text-purple-500', bg: 'bg-purple-100' },
    };
    return displays[severity] || displays[ERROR_SEVERITY.ERROR];
  };

  // Format timestamp
  const formatTimestamp = timestamp => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className='fixed bottom-4 right-4 z-50 w-14 h-14 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center'
        title='Error DevTools'
      >
        <Bug size={24} />
        {errorStats.totalErrors > 0 && (
          <div className='absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 text-xs font-bold rounded-full flex items-center justify-center'>
            {errorStats.totalErrors > 99 ? '99+' : errorStats.totalErrors}
          </div>
        )}
      </motion.button>

      {/* Error DevTools Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-40 bg-black/50 backdrop-blur-sm'
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className='absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl overflow-hidden'
              onClick={e => e.stopPropagation()}
            >
              <div className='flex flex-col h-full'>
                {/* Header */}
                <div className='bg-red-500 text-white p-4 flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <Bug size={24} />
                    <div>
                      <h2 className='text-xl font-bold'>Error DevTools</h2>
                      <p className='text-red-100 text-sm'>{errorStats.totalErrors} errors logged</p>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setErrors(getErrorHistory())}
                      className='p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors'
                      title='Refresh'
                    >
                      <RefreshCw size={18} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={exportErrorHistory}
                      className='p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors'
                      title='Export Errors'
                    >
                      <Download size={18} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        clearErrorHistory();
                        setErrors([]);
                        setSelectedError(null);
                      }}
                      className='p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors'
                      title='Clear All Errors'
                    >
                      <Trash2 size={18} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsOpen(false)}
                      className='p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors'
                    >
                      <X size={18} />
                    </motion.button>
                  </div>
                </div>

                <div className='flex flex-1 overflow-hidden'>
                  {/* Error List */}
                  <div className='w-1/2 border-r border-gray-200 flex flex-col'>
                    {/* Filters */}
                    <div className='p-4 border-b border-gray-200'>
                      <div className='flex space-x-2'>
                        {[
                          'all',
                          ERROR_SEVERITY.FATAL,
                          ERROR_SEVERITY.ERROR,
                          ERROR_SEVERITY.WARNING,
                          ERROR_SEVERITY.INFO,
                        ].map(severity => (
                          <motion.button
                            key={severity}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setFilter(severity)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              filter === severity
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {severity === 'all' ? 'All' : severity.toUpperCase()}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Error List */}
                    <div className='flex-1 overflow-y-auto'>
                      {filteredErrors.length === 0 ? (
                        <div className='p-8 text-center text-gray-500'>
                          <Bug size={48} className='mx-auto mb-4 text-gray-300' />
                          <p>No errors found</p>
                          <p className='text-sm'>Start using the app to generate error logs</p>
                        </div>
                      ) : (
                        <div className='space-y-1 p-2'>
                          {filteredErrors.reverse().map(error => {
                            const severityDisplay = getSeverityDisplay(error.severity);
                            const Icon = severityDisplay.icon;

                            return (
                              <motion.button
                                key={error.id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setSelectedError(error)}
                                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                  selectedError?.id === error.id
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <div className='flex items-start space-x-3'>
                                  <div className={`p-1 rounded-full ${severityDisplay.bg}`}>
                                    <Icon size={14} className={severityDisplay.color} />
                                  </div>

                                  <div className='flex-1 min-w-0'>
                                    <p className='font-medium text-gray-900 truncate'>
                                      {error.message}
                                    </p>
                                    <p className='text-xs text-gray-500 mt-1'>
                                      {formatTimestamp(error.timestamp)}
                                    </p>
                                    <div className='flex items-center space-x-2 mt-2'>
                                      <span
                                        className={`text-xs px-2 py-1 rounded-full ${severityDisplay.bg} ${severityDisplay.color} font-medium`}
                                      >
                                        {error.severity}
                                      </span>
                                      <span className='text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium'>
                                        {error.category}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error Details */}
                  <div className='w-1/2 flex flex-col'>
                    {selectedError ? (
                      <div className='flex-1 overflow-y-auto p-6'>
                        <div className='space-y-6'>
                          {/* Error Header */}
                          <div>
                            <div className='flex items-center space-x-3 mb-4'>
                              {(() => {
                                const severityDisplay = getSeverityDisplay(selectedError.severity);
                                const Icon = severityDisplay.icon;
                                return (
                                  <div className={`p-2 rounded-full ${severityDisplay.bg}`}>
                                    <Icon size={20} className={severityDisplay.color} />
                                  </div>
                                );
                              })()}
                              <div>
                                <h3 className='text-lg font-bold text-gray-900'>
                                  {selectedError.message}
                                </h3>
                                <p className='text-sm text-gray-500'>
                                  Error ID: {selectedError.id}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-3'>
                              <div className='flex items-center space-x-2 text-sm'>
                                <Calendar size={16} className='text-gray-400' />
                                <span className='text-gray-600'>Timestamp:</span>
                                <span className='font-medium'>
                                  {formatTimestamp(selectedError.timestamp)}
                                </span>
                              </div>

                              <div className='flex items-center space-x-2 text-sm'>
                                <MapPin size={16} className='text-gray-400' />
                                <span className='text-gray-600'>URL:</span>
                                <span className='font-medium truncate'>{selectedError.url}</span>
                              </div>

                              <div className='flex items-center space-x-2 text-sm'>
                                <User size={16} className='text-gray-400' />
                                <span className='text-gray-600'>User ID:</span>
                                <span className='font-medium'>{selectedError.userId}</span>
                              </div>
                            </div>

                            <div className='space-y-3'>
                              <div className='flex items-center space-x-2 text-sm'>
                                <Monitor size={16} className='text-gray-400' />
                                <span className='text-gray-600'>Viewport:</span>
                                <span className='font-medium'>
                                  {selectedError.viewport?.width}x{selectedError.viewport?.height}
                                </span>
                              </div>

                              <div className='flex items-center space-x-2 text-sm'>
                                <Bug size={16} className='text-gray-400' />
                                <span className='text-gray-600'>Category:</span>
                                <span className='font-medium'>{selectedError.category}</span>
                              </div>

                              <div className='flex items-center space-x-2 text-sm'>
                                <AlertTriangle size={16} className='text-gray-400' />
                                <span className='text-gray-600'>Severity:</span>
                                <span className='font-medium'>{selectedError.severity}</span>
                              </div>
                            </div>
                          </div>

                          {/* Context */}
                          {selectedError.context &&
                            Object.keys(selectedError.context).length > 0 && (
                              <div>
                                <h4 className='font-semibold text-gray-800 mb-2'>Context</h4>
                                <pre className='bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto'>
                                  {JSON.stringify(selectedError.context, null, 2)}
                                </pre>
                              </div>
                            )}

                          {/* Stack Trace */}
                          {selectedError.stack && (
                            <div>
                              <h4 className='font-semibold text-gray-800 mb-2'>Stack Trace</h4>
                              <pre className='bg-red-50 p-3 rounded-lg text-xs overflow-x-auto border border-red-200'>
                                {selectedError.stack}
                              </pre>
                            </div>
                          )}

                          {/* Performance Metrics */}
                          {selectedError.performance &&
                            Object.keys(selectedError.performance).length > 0 && (
                              <div>
                                <h4 className='font-semibold text-gray-800 mb-2'>
                                  Performance Metrics
                                </h4>
                                <pre className='bg-blue-50 p-3 rounded-lg text-xs overflow-x-auto border border-blue-200'>
                                  {JSON.stringify(selectedError.performance, null, 2)}
                                </pre>
                              </div>
                            )}
                        </div>
                      </div>
                    ) : (
                      <div className='flex-1 flex items-center justify-center text-gray-500'>
                        <div className='text-center'>
                          <Eye size={48} className='mx-auto mb-4 text-gray-300' />
                          <p>Select an error to view details</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ErrorDevTools;
