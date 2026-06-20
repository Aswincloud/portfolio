/**
 * @file SearchModal.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Search modal component with keyboard navigation and filtering
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ArrowUp, ArrowDown } from 'lucide-react';

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const searchItems = [
    { name: 'About Me', href: '#about', description: 'Learn about my background and experience' },
    { name: 'Experience', href: '#experience', description: 'View my professional experience' },
    { name: 'Skills', href: '#skills', description: 'Explore my technical skills' },
    { name: 'Projects', href: '#projects', description: 'Check out my software projects' },
    { name: 'Contact', href: '#contact', description: 'Get in touch with me' },
  ];

  const filteredItems = searchItems.filter(
    item =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = e => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            window.location.href = filteredItems[selectedIndex].href;
            onClose();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  const handleItemClick = href => {
    window.location.href = href;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4'
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className='bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[70vh] overflow-hidden'
          onClick={e => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className='p-4 border-b border-gray-200'>
            <div className='flex items-center gap-3'>
              <Search size={20} className='text-gray-400' />
              <input
                ref={inputRef}
                type='text'
                placeholder='Search sections...'
                value={query}
                onChange={e => setQuery(e.target.value)}
                className='flex-1 text-lg outline-none placeholder-gray-400'
              />
              <button
                onClick={onClose}
                className='p-1 hover:bg-gray-100 rounded-lg transition-colors'
                aria-label='Close search'
              >
                <X size={20} className='text-gray-400' />
              </button>
            </div>
          </div>

          {/* Search Results */}
          <div className='max-h-[50vh] overflow-y-auto'>
            {filteredItems.length > 0 ? (
              <div className='py-2'>
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      index === selectedIndex
                        ? 'bg-secondary-50 border-r-2 border-secondary-500'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleItemClick(item.href)}
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='font-medium text-gray-900'>{item.name}</h3>
                        <p className='text-sm text-gray-500'>{item.description}</p>
                      </div>
                      <div className='flex items-center gap-2 text-gray-400'>
                        {index === selectedIndex && (
                          <div className='flex items-center gap-1 text-xs'>
                            <span>Press</span>
                            <kbd className='px-2 py-1 bg-gray-100 rounded text-gray-600'>Enter</kbd>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className='p-8 text-center text-gray-500'>
                <Search size={48} className='mx-auto mb-4 text-gray-300' />
                <p>No results found for "{query}"</p>
              </div>
            )}
          </div>

          {/* Search Footer */}
          <div className='p-4 border-t border-gray-200 bg-gray-50'>
            <div className='flex items-center justify-between text-sm text-gray-500'>
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-1'>
                  <ArrowUp size={14} />
                  <ArrowDown size={14} />
                  <span>Navigate</span>
                </div>
                <div className='flex items-center gap-1'>
                  <kbd className='px-2 py-1 bg-white rounded text-gray-600'>Enter</kbd>
                  <span>Select</span>
                </div>
              </div>
              <div className='flex items-center gap-1'>
                <kbd className='px-2 py-1 bg-white rounded text-gray-600'>Esc</kbd>
                <span>Close</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SearchModal;
