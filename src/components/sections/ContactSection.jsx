/**
 * @file ContactSection.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Contact — dark form + contact cards. Submit logic (POST
 *   /api/contact with graceful offline fallback) is unchanged from the
 *   original; only the presentation is reskinned.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { Mail, MapPin, Briefcase, Send, Check, AlertTriangle, Copy } from 'lucide-react';
import { useRipple } from '../../hooks';

const EMAIL = 'contact@aswincloud.com';

const CONTACT_INFO = [
  {
    icon: <Mail size={20} />,
    title: 'Email',
    content: EMAIL,
    link: `mailto:${EMAIL}`,
    copyValue: EMAIL,
  },
  { icon: <MapPin size={20} />, title: 'Location', content: 'Pondicherry, India', link: null },
  {
    icon: <Briefcase size={20} />,
    title: 'Work',
    content: 'Web design & builds, consulting & collaboration',
    link: null,
  },
];

const ContactSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  // `company` is a honeypot — see the hidden field in the form below. It is part of
  // formData purely so the existing JSON.stringify(formData) submits it unchanged.
  const [formData, setFormData] = useState({ name: '', email: '', message: '', company: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const { createRipple } = useRipple();
  const submitButtonRef = React.useRef(null);
  const [copied, setCopied] = useState(false);

  // Click-to-copy for the email card. Prefer the async Clipboard API; fall back
  // to a hidden textarea + execCommand for non-secure contexts / older engines.
  const copyEmail = React.useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(EMAIL);
      } else {
        const ta = document.createElement('textarea');
        ta.value = EMAIL;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the mailto link beside it still works.
    }
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();

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
      const apiUrl = import.meta.env.DEV ? 'http://localhost:3001/api/contact' : '/api/contact';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '', company: '' });
      } else if (data.errors && data.errors.length > 0) {
        const errorMessages = data.errors.map(err => `${err.param}: ${err.msg}`).join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Fallback: if the backend isn't reachable, don't punish the visitor.
      if (error instanceof TypeError || error.name === 'NetworkError') {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '', company: '' });
      } else {
        setSubmitStatus('error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fieldClass =
    'w-full rounded-xl border border-hairline bg-surface-2 px-4 py-3 text-slate-100 placeholder:text-slate-600 transition-colors focus:border-brand-500/60 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-brand-500/40 disabled:opacity-50';

  return (
    <section id='contact' className='section-padding relative overflow-hidden section-seam bg-ink'>
      {/* soft glow behind the form */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute left-1/2 top-1/4 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full opacity-60'
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 60%)' }}
      />

      <div className='container-custom relative z-10'>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className='mb-14 max-w-2xl'
        >
          <p className='eyebrow mb-5'>
            <span className='text-slate-600'>06 /</span> Contact
          </p>
          <h2 className='text-4xl font-bold sm:text-5xl'>
            Let&apos;s <span className='gradient-text'>work</span> together
          </h2>
          <p className='mt-4 text-lg leading-relaxed text-slate-400'>
            Have a project, a performance problem, or just want to talk shop? Drop me a line.
          </p>
        </motion.div>

        <div className='grid gap-6 lg:grid-cols-[0.8fr_1.2fr]'>
          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className='flex flex-col gap-4'
          >
            {CONTACT_INFO.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.1 }}
                className='group card-surface flex items-start gap-4 p-5 transition-colors hover:border-slate-600'
              >
                <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-brand-300'>
                  {item.icon}
                </span>
                <div className='min-w-0 flex-1'>
                  <h3 className='font-mono text-xs uppercase tracking-wider text-slate-500'>
                    {item.title}
                  </h3>
                  {item.link ? (
                    <a
                      href={item.link}
                      className='mt-1 block truncate font-medium text-slate-200 transition-colors hover:text-brand-300'
                    >
                      {item.content}
                    </a>
                  ) : (
                    <p className='mt-1 font-medium text-slate-200'>{item.content}</p>
                  )}
                </div>
                {item.copyValue && (
                  <button
                    type='button'
                    onClick={copyEmail}
                    aria-label={copied ? 'Email copied to clipboard' : 'Copy email address'}
                    className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface-2 text-slate-400 transition-colors hover:border-brand-500/40 hover:text-brand-300'
                  >
                    {copied ? <Check size={15} className='text-brand-400' /> : <Copy size={15} />}
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.25 }}
            className='card-surface p-6 sm:p-8'
          >
            <form onSubmit={handleSubmit} className='space-y-5'>
              {/*
                Honeypot. Bots that fill every input in the form give themselves away;
                the Worker silently drops any submission where this arrives non-empty.

                Hidden with a wrapper that is removed from the accessibility tree and
                taken out of the tab order, rather than `type='hidden'` (which bots read
                and skip) or `display: none` (which some password managers and mobile
                browsers still autofill). `autoComplete='off'` keeps browsers from
                helpfully filling it in on a real visitor's behalf, which would otherwise
                reject a genuine message.
              */}
              <div aria-hidden='true' className='absolute -left-[9999px] h-0 w-0 overflow-hidden'>
                <label htmlFor='contact-company'>Company (leave this field empty)</label>
                <input
                  id='contact-company'
                  type='text'
                  name='company'
                  value={formData.company}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete='off'
                />
              </div>

              {submitStatus === 'success' && (
                <div
                  role='status'
                  className='flex items-start gap-3 rounded-xl border border-brand-500/30 bg-brand-500/10 p-4'
                >
                  <Check size={18} className='mt-0.5 shrink-0 text-brand-400' />
                  <div>
                    <p className='text-sm font-medium text-brand-200'>Message sent successfully.</p>
                    <p className='mt-1 text-sm text-slate-400'>
                      I&apos;ll get back to you within 24–48 hours — or reach me directly at
                      contact@aswincloud.com.
                    </p>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div
                  role='alert'
                  className='flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4'
                >
                  <AlertTriangle size={18} className='mt-0.5 shrink-0 text-red-400' />
                  <div>
                    <p className='text-sm font-medium text-red-300'>
                      Couldn&apos;t send your message. Please check:
                    </p>
                    <ul className='mt-1 list-inside list-disc text-sm text-slate-400'>
                      <li>Name: letters and spaces (2–100 characters)</li>
                      <li>Email: a valid email address</li>
                      <li>Message: 10–1000 characters</li>
                    </ul>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor='contact-name'
                  className='mb-2 block font-mono text-xs uppercase tracking-wider text-slate-400'
                >
                  Name
                </label>
                <input
                  id='contact-name'
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  placeholder='Your full name'
                  className={fieldClass}
                  required
                  disabled={isSubmitting}
                  autoComplete='name'
                />
              </div>

              <div>
                <label
                  htmlFor='contact-email'
                  className='mb-2 block font-mono text-xs uppercase tracking-wider text-slate-400'
                >
                  Email
                </label>
                <input
                  id='contact-email'
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  placeholder='you@example.com'
                  className={fieldClass}
                  required
                  disabled={isSubmitting}
                  autoComplete='email'
                />
              </div>

              <div>
                <label
                  htmlFor='contact-message'
                  className='mb-2 block font-mono text-xs uppercase tracking-wider text-slate-400'
                >
                  Message
                </label>
                <textarea
                  id='contact-message'
                  name='message'
                  value={formData.message}
                  onChange={handleChange}
                  placeholder='Tell me about your project or idea…'
                  rows={5}
                  className={`${fieldClass} resize-none`}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <motion.button
                ref={submitButtonRef}
                type='submit'
                disabled={isSubmitting}
                aria-label='Send contact message'
                whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
                className='relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-brand-500 to-cyan-500 px-6 py-3.5 font-semibold text-ink shadow-lg shadow-brand-500/20 transition-shadow hover:shadow-xl hover:shadow-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60'
              >
                {isSubmitting ? (
                  <>
                    <span className='h-5 w-5 animate-spin rounded-full border-2 border-ink/40 border-t-ink' />
                    <span>Sending…</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Send message</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
