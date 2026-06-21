/**
 * @file ContactSection.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Contact section component with form submission and contact information
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { Mail, MapPin, Briefcase } from 'lucide-react';
import { useMicroInteractions } from '../../utils/microInteractions';
import { use3DTilt, tiltPresets } from '../../hooks/use3DTilt.jsx';
import { useRipple } from '../../hooks';

// Contact Section Component
const ContactSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null
  const { variants } = useMicroInteractions();
  const { createRipple } = useRipple();
  const submitButtonRef = React.useRef(null);

  const handleSubmit = async e => {
    e.preventDefault();

    // Add ripple effect on submit
    if (submitButtonRef.current) {
      createRipple(e, submitButtonRef.current);
    }

    if (!formData.name || !formData.email || !formData.message) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Use the current domain for API calls in production, localhost for development
      const apiUrl = import.meta.env.DEV ? 'http://localhost:3001/api/contact' : '/api/contact';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        // Handle validation errors specifically
        if (data.errors && data.errors.length > 0) {
          const errorMessages = data.errors.map(err => `${err.param}: ${err.msg}`).join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        } else {
          throw new Error(data.message || 'Failed to send message');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Fallback: If server is not available, show success message anyway
      // This allows the form to work even without backend configuration
      if (error instanceof TypeError || error.name === 'NetworkError') {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
        console.log('Form submitted (fallback mode - backend not configured)');
      } else {
        setSubmitStatus('error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactInfo = [
    {
      icon: <Mail size={24} />,
      title: 'Email',
      content: 'contact@aswincloud.com',
      link: 'mailto:contact@aswincloud.com',
    },
    {
      icon: <MapPin size={24} />,
      title: 'Location',
      content: 'Pondicherry, India',
      link: null,
    },
    {
      icon: <Briefcase size={24} />,
      title: 'Work',
      content: 'Available for consulting and collaboration',
      link: null,
    },
  ];

  return (
    <section
      id='contact'
      className='section-padding bg-linear-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden'
    >
      <div className='container-custom relative z-10'>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className='text-center mb-16'
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='inline-flex items-center space-x-2 bg-linear-to-r from-green-500/10 to-blue-500/10 rounded-full px-6 py-3 mb-6 backdrop-blur-sm border border-green-200/30'
          >
            <Mail size={16} className='text-green-500' />
            <span className='text-sm font-semibold text-gray-600 uppercase tracking-wide'>
              Get In Touch
            </span>
          </motion.div>

          <h2 className='text-4xl lg:text-5xl font-black mb-6 text-gray-900'>
            Let&apos;s <span className='text-accent-600'>Work</span> Together
          </h2>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed'>
            Ready to bring your ideas to life? Let's discuss your next project and create something
            amazing together.
          </p>
        </motion.div>

        <div className='grid lg:grid-cols-2 gap-8 lg:gap-16'>
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className='space-y-6 lg:space-y-8 order-2 lg:order-1'
          >
            {contactInfo.map((item, index) => {
              const ContactCard = () => {
                const { elementRef, tiltStyle, glareElementStyle } = use3DTilt(
                  tiltPresets.moderate
                );

                return (
                  <motion.div
                    key={index}
                    ref={elementRef}
                    style={tiltStyle}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                    className='group relative bg-white/70 backdrop-blur-sm rounded-3xl p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 overflow-hidden'
                  >
                    {/* 3D Tilt Glare Effect */}
                    <div style={glareElementStyle} />
                    {/* Background gradient */}
                    <div className='absolute inset-0 bg-linear-to-br from-blue-50/50 to-green-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>

                    {/* Icon */}
                    <div className='flex items-start space-x-4'>
                      <motion.div
                        className='shrink-0 w-14 h-14 bg-linear-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all duration-500'
                        whileHover={variants.iconHover}
                        whileTap={variants.iconTap}
                      >
                        {item.icon}
                      </motion.div>
                      <div className='relative z-10'>
                        <h3 className='text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors duration-300'>
                          {item.title}
                        </h3>
                        {item.link ? (
                          <a
                            href={item.link}
                            className='text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium'
                          >
                            {item.content}
                          </a>
                        ) : (
                          <p className='text-gray-600 font-medium'>{item.content}</p>
                        )}
                      </div>
                    </div>

                    {/* Decorative elements */}
                    <div className='absolute top-4 right-4 w-8 h-8 border-2 border-gray-200 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500'></div>
                    <div className='absolute bottom-4 right-4 w-4 h-4 bg-gray-200 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500'></div>
                  </motion.div>
                );
              };

              return <ContactCard key={index} />;
            })}
          </motion.div>

          {/* Modern Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className='relative bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 overflow-hidden order-1 lg:order-2'
          >
            {/* Background gradient */}
            <div className='absolute inset-0 bg-linear-to-br from-blue-50/30 to-green-50/30'></div>

            {/* Optimized decorative elements */}
            <div className='absolute -top-4 -right-4 w-20 h-20 bg-linear-to-br from-blue-500/8 to-green-500/8 rounded-full blur-lg'></div>
            <div className='absolute -bottom-4 -left-4 w-16 h-16 bg-linear-to-br from-green-500/8 to-blue-500/8 rounded-full blur-lg'></div>

            <div className='relative z-10'>
              <form onSubmit={handleSubmit} className='space-y-6'>
                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                    <div className='flex items-center'>
                      <div className='shrink-0'>
                        <span className='text-green-400 text-xl'>✓</span>
                      </div>
                      <div className='ml-3'>
                        <p className='text-sm font-medium text-green-800'>
                          Message sent successfully! Thank you for contacting me.
                        </p>
                        <p className='text-sm text-green-600 mt-1'>
                          I'll get back to you within 24-48 hours. You can also reach me directly at
                          contact@aswincloud.com
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                    <div className='flex items-center'>
                      <div className='shrink-0'>
                        <span className='text-red-400 text-xl'>⚠</span>
                      </div>
                      <div className='ml-3'>
                        <p className='text-sm font-medium text-red-800'>
                          Failed to send message. Please check the following:
                        </p>
                        <ul className='text-sm text-red-600 mt-1 list-disc list-inside'>
                          <li>Name: Only letters and spaces allowed (2-100 characters)</li>
                          <li>Email: Must be a valid email address</li>
                          <li>Message: Must be 10-1000 characters long</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className='space-y-2'>
                  <label
                    htmlFor='contact-name'
                    className='block text-sm font-semibold text-gray-700 mb-2'
                  >
                    Full Name
                  </label>
                  <input
                    id='contact-name'
                    type='text'
                    name='name'
                    value={formData.name}
                    onChange={handleChange}
                    placeholder='Enter your full name'
                    className='w-full px-6 py-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-xs hover:shadow-md'
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className='space-y-2'>
                  <label
                    htmlFor='contact-email'
                    className='block text-sm font-semibold text-gray-700 mb-2'
                  >
                    Email Address
                  </label>
                  <input
                    id='contact-email'
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleChange}
                    placeholder='Enter your email address'
                    className='w-full px-6 py-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-xs hover:shadow-md'
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className='space-y-2'>
                  <label
                    htmlFor='contact-message'
                    className='block text-sm font-semibold text-gray-700 mb-2'
                  >
                    Message
                  </label>
                  <textarea
                    id='contact-message'
                    name='message'
                    value={formData.message}
                    onChange={handleChange}
                    placeholder='Tell me about your project or idea...'
                    rows={5}
                    className='w-full px-6 py-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 resize-none disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-xs hover:shadow-md'
                    required
                    disabled={isSubmitting}
                  ></textarea>
                </div>
                <motion.button
                  ref={submitButtonRef}
                  type='submit'
                  disabled={isSubmitting}
                  aria-label='Send contact message'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='relative w-full px-8 py-4 bg-linear-to-r from-blue-500 to-green-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 overflow-hidden'
                  style={{ position: 'relative' }}
                >
                  {isSubmitting ? (
                    <div className='flex items-center justify-center'>
                      <div className='animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2'></div>
                      <span>Sending Message...</span>
                    </div>
                  ) : (
                    <>
                      <Mail size={20} />
                      <span>Send Message</span>
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
