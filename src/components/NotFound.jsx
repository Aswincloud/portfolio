/**
 * @file NotFound.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description 404 Not Found page component with navigation and error handling
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, ArrowLeft, Search, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center py-20'>
      <div className='container-custom'>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className='text-center max-w-2xl mx-auto'
        >
          {/* 404 Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className='mb-8'
          >
            <div className='inline-flex items-center justify-center w-24 h-24 bg-linear-to-r from-secondary-500 to-accent-500 rounded-full text-white mb-6'>
              <AlertTriangle size={48} />
            </div>
          </motion.div>

          {/* 404 Text */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='text-6xl lg:text-8xl font-bold text-gray-900 mb-4'
          >
            404
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='text-2xl lg:text-3xl font-bold text-gray-900 mb-4'
          >
            Page Not Found
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className='text-lg text-gray-600 mb-8 leading-relaxed'
          >
            Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or
            you entered the wrong URL.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className='flex flex-col sm:flex-row gap-4 justify-center'
          >
            <Link
              to='/'
              className='inline-flex items-center px-6 py-3 bg-linear-to-r from-secondary-600 to-accent-600 text-white rounded-lg hover:from-secondary-700 hover:to-accent-700 transition-all duration-300 transform hover:scale-105 shadow-lg'
              aria-label='Go back to homepage'
            >
              <Home size={20} className='mr-2' />
              Go Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className='inline-flex items-center px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-secondary-500 transition-all duration-300 transform hover:scale-105 shadow-lg'
              aria-label='Go back to previous page'
            >
              <ArrowLeft size={20} className='mr-2' />
              Go Back
            </button>
          </motion.div>

          {/* Search Suggestion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className='mt-12 p-6 bg-white rounded-lg shadow-lg'
          >
            <div className='flex items-center justify-center mb-4'>
              <Search size={20} className='text-secondary-600 mr-2' />
              <h3 className='text-lg font-semibold text-gray-900'>
                Looking for something specific?
              </h3>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
              <Link
                to='/#about'
                className='text-secondary-600 hover:text-secondary-700 transition-colors duration-200'
                aria-label='Navigate to about section'
              >
                About Me
              </Link>
              <Link
                to='/#projects'
                className='text-secondary-600 hover:text-secondary-700 transition-colors duration-200'
                aria-label='Navigate to projects section'
              >
                My Projects
              </Link>
              <Link
                to='/#experience'
                className='text-secondary-600 hover:text-secondary-700 transition-colors duration-200'
                aria-label='Navigate to experience section'
              >
                Experience
              </Link>
              <Link
                to='/#contact'
                className='text-secondary-600 hover:text-secondary-700 transition-colors duration-200'
                aria-label='Navigate to contact section'
              >
                Contact Me
              </Link>
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className='mt-8 text-center'
          >
            <p className='text-gray-500 mb-2'>Still can't find what you're looking for?</p>
            <a
              href='mailto:contact@aswincloud.com'
              className='text-secondary-600 hover:text-secondary-700 font-medium transition-colors duration-200'
              aria-label='Send email to contact@aswincloud.com'
            >
              contact@aswincloud.com
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
