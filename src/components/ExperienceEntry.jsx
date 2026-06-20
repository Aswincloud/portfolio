/**
 * @file ExperienceEntry.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Individual experience entry component with timeline design and company branding
 */

import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar, Building, Zap, Code, Cpu } from 'lucide-react';
import { use3DTilt, tiltPresets } from '../hooks/use3DTilt.jsx';

// Experience Entry Component
function ExperienceEntryComponent({
  period,
  title,
  company,
  location,
  logo,
  description,
  experience,
  inView = false,
  delay = 0.1,
}) {
  // Define company-specific themes
  const getCompanyTheme = React.useMemo(
    () => companyName => {
      if (companyName.includes('MulticoreWare')) {
        return {
          gradient: 'from-blue-500 to-indigo-600',
          bgGradient: 'from-blue-50 to-indigo-50',
          icon: <Cpu size={20} />,
          accentColor: 'text-blue-600',
          borderColor: 'border-blue-200',
          timelineColor: 'bg-blue-600',
          tagBg: 'bg-blue-100',
          tagText: 'text-blue-800',
          hoverShadow: 'hover:shadow-blue-500/20',
        };
      } else if (companyName.includes('Lenovo')) {
        return {
          gradient: 'from-emerald-500 to-teal-600',
          bgGradient: 'from-emerald-50 to-teal-50',
          icon: <Code size={20} />,
          accentColor: 'text-emerald-600',
          borderColor: 'border-emerald-200',
          timelineColor: 'bg-emerald-600',
          tagBg: 'bg-emerald-100',
          tagText: 'text-emerald-800',
          hoverShadow: 'hover:shadow-emerald-500/20',
        };
      }
      // Default theme
      return {
        gradient: 'from-gray-500 to-gray-600',
        bgGradient: 'from-gray-50 to-gray-50',
        icon: <Building size={20} />,
        accentColor: 'text-gray-600',
        borderColor: 'border-gray-200',
        timelineColor: 'bg-gray-600',
        tagBg: 'bg-gray-100',
        tagText: 'text-gray-800',
        hoverShadow: 'hover:shadow-gray-500/20',
      };
    },
    []
  );

  const theme = React.useMemo(() => getCompanyTheme(company), [company, getCompanyTheme]);
  const { elementRef, tiltStyle, glareElementStyle } = use3DTilt(tiltPresets.subtle);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay }}
      className='relative mb-8 md:mb-12'
    >
      {/* Enhanced Timeline dot with company theme - Hidden on mobile, visible on desktop */}
      <div
        aria-hidden='true'
        className={`hidden md:block absolute top-8 w-5 h-5 ${theme.timelineColor} rounded-full border-4 border-white shadow-lg z-10`}
        style={{ left: '15px' }}
      ></div>

      {/* Enhanced card with company-specific styling - Full width on mobile, left margin on desktop */}
      <motion.div
        ref={elementRef}
        style={tiltStyle}
        className={`md:ml-20 bg-white rounded-2xl p-6 md:p-8 shadow-lg ${theme.hoverShadow} hover:shadow-xl transition-shadow duration-300 border ${theme.borderColor} overflow-hidden relative group`}
      >
        {/* 3D Tilt Glare Effect */}
        <div style={glareElementStyle} />
        {/* Simplified background gradient overlay */}
        <div
          className={`absolute inset-0 bg-linear-to-br ${theme.bgGradient} opacity-20 group-hover:opacity-30 transition-opacity duration-300`}
        ></div>

        {/* Simplified decorative elements - Removed blur for performance */}
        <div
          className={`absolute -top-4 -right-4 w-16 h-16 bg-linear-to-br ${theme.gradient} opacity-5 rounded-full group-hover:opacity-10 transition-opacity duration-300`}
        ></div>
        <div
          className={`absolute -bottom-4 -left-4 w-12 h-12 bg-linear-to-br ${theme.gradient} opacity-5 rounded-full group-hover:opacity-10 transition-opacity duration-300`}
        ></div>

        {/* Content */}
        <div className='relative z-10'>
          {/* Period with enhanced styling */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 ${theme.tagBg} ${theme.tagText} rounded-full text-sm font-semibold mb-4`}
          >
            <Calendar size={16} />
            <span>{period}</span>
          </div>

          {/* Company header with logo and info - Better mobile layout */}
          <div className='flex flex-col sm:flex-row items-start gap-4 mb-6'>
            <motion.div
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2, ease: 'easeOut' },
              }}
              className='shrink-0 self-center sm:self-start'
            >
              <img
                src={logo}
                alt={`Company logo for ${company}`}
                width={56}
                height={56}
                loading='lazy'
                className='w-14 h-14 object-contain rounded-xl shadow-md bg-white p-2'
              />
            </motion.div>

            <div className='flex-1 text-center sm:text-left'>
              <h3 className='text-xl sm:text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors duration-200'>
                {title}
              </h3>
              <h4 className={`text-lg font-semibold mb-2 ${theme.accentColor}`}>{company}</h4>
              {location && (
                <div className='flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-500'>
                  <MapPin size={14} />
                  <span>{location}</span>
                </div>
              )}
            </div>

            {/* Company theme icon - Better mobile positioning */}
            <div
              className={`p-3 rounded-xl bg-linear-to-br ${theme.gradient} text-white shadow-lg self-center sm:self-start`}
            >
              {theme.icon}
            </div>
          </div>

          {/* Description with better typography */}
          <p className='text-gray-700 leading-relaxed mb-6 text-base sm:text-lg text-center sm:text-left'>
            {description}
          </p>

          {/* Experience badge with theme colors - Centered on mobile */}
          <div className='flex flex-col sm:flex-row items-center sm:justify-between gap-4'>
            <div
              className={`inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r ${theme.gradient} text-white rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-shadow duration-200`}
            >
              <Zap size={16} />
              <span>{experience}</span>
            </div>

            {/* Simplified decorative corner element */}
            <div
              className={`w-8 h-8 rounded-full bg-linear-to-br ${theme.gradient} opacity-15 group-hover:opacity-25 transition-opacity duration-200`}
            ></div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const ExperienceEntry = React.memo(ExperienceEntryComponent);

export default ExperienceEntry;
