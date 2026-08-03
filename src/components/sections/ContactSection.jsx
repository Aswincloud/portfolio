/**
 * @file ContactSection.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Contact — dark form + contact cards. Submits to POST /api/contact
 *   and distinguishes three outcomes: sent, input rejected (fixable by editing),
 *   and not delivered (offer the direct address, keep what was typed).
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import SectionHeader from '../SectionHeader.jsx';
import { sectionAccent } from '../../data/sectionAccents.js';
import { Mail, MapPin, Briefcase, Send, Check, AlertTriangle, Copy } from 'lucide-react';
import { useRipple } from '../../hooks';
import { LIMITS, LIMIT_HINTS } from '../../data/contactLimits.js';

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

/**
 * Distinguishes "the visitor can fix this by editing the form" from "the message did not
 * get through". They need different copy: a validation checklist is useless advice when
 * the API is down, and the direct address is noise when the email is simply malformed.
 */
class SubmitError extends Error {
  constructor(kind) {
    super(`Submit failed: ${kind}`);
    this.name = 'SubmitError';
    this.kind = kind; // 'invalid' | 'failed'
  }
}

const ContactSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  // `company` is a honeypot — see the hidden field in the form below. It is part of
  // formData purely so the existing JSON.stringify(formData) submits it unchanged.
  const [formData, setFormData] = useState({ name: '', email: '', message: '', company: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // null | 'success' | 'invalid' (visitor can fix it) | 'failed' (delivery failed)
  const [submitStatus, setSubmitStatus] = useState(null);
  const { createRipple } = useRipple();
  const submitButtonRef = React.useRef(null);
  const [copied, setCopied] = useState(false);
  const statusRef = React.useRef(null);

  // Move focus to the outcome panel once it appears.
  //
  // role='alert' and role='status' make a screen reader announce these, but a
  // sighted keyboard or mobile visitor got nothing: the panel renders *above* the
  // fields, so on a phone the reason a submission failed can be off-screen while
  // you are still looking at the button you pressed. Focusing it both scrolls it
  // into view and puts the next Tab inside the panel, which is where the mailto
  // fallback lives on the 'failed' branch.
  //
  // tabIndex={-1} on the panel makes it focusable without adding it to the tab
  // order. preventScroll is deliberately *not* set — the scroll is half the point.
  React.useEffect(() => {
    if (submitStatus) statusRef.current?.focus();
  }, [submitStatus]);

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

    // Mirror the Worker's own checks (worker.js reads the same LIMITS), and on the
    // trimmed values, because that is what it validates — otherwise a message of
    // ten spaces passes here and comes back 400.
    //
    // This used to test only for emptiness, so the form accepted input it had just
    // finished telling the visitor was invalid: a nine-character message made a
    // round trip to learn a rule stated on screen. The inputs now carry
    // minLength/maxLength too, which catches it earlier still — this stays as the
    // backstop for the paths native validation misses (a paste that trims short,
    // and browsers that skip constraint validation on a scripted submit).
    const name = formData.name.trim();
    const email = formData.email.trim();
    const message = formData.message.trim();
    const withinLimits =
      name.length >= LIMITS.name.min &&
      name.length <= LIMITS.name.max &&
      email.length > 0 &&
      email.length <= LIMITS.email.max &&
      message.length >= LIMITS.message.min &&
      message.length <= LIMITS.message.max;

    if (!withinLimits) {
      setSubmitStatus('invalid');
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

      // A non-JSON body (an HTML error page from a proxy, say) throws here and is handled
      // below as a delivery failure, which is the right classification for it.
      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '', company: '' });
        return;
      }

      // 4xx means the input was rejected and re-editing it can succeed. Anything else —
      // 5xx, 502 from the Worker when Resend is down — is not the visitor's fault and
      // retrying the same form won't help, so offer the direct address instead.
      throw new SubmitError(response.status >= 400 && response.status < 500 ? 'invalid' : 'failed');
    } catch (error) {
      console.error('Error sending message:', error);

      // Anything that isn't a SubmitError is a transport or runtime failure — notably
      // fetch()'s TypeError when the request never completed (offline, DNS, CORS). That
      // case used to be reported as success on the theory that it shouldn't "punish the
      // visitor", but it told them a message had been sent that had not been, and cleared
      // the form, so they lost what they wrote and had no reason to follow up. Treat it as
      // the delivery failure it is and keep their text so the mailto fallback is useful.
      setSubmitStatus(error instanceof SubmitError ? error.kind : 'failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * What the counter beside the Message label says.
   *
   * Counts the trimmed length, because that is the number the Worker checks — a
   * counter reading 12 on a message that validates as 8 would be actively
   * misleading at the boundary.
   *
   * Stays quiet in the middle of the range: an untouched field says nothing, a
   * too-short one says how many more characters are needed, and only the last
   * 100 characters before the ceiling start counting down. The alternative — a
   * permanent "413 / 1000" — is a number nobody needs for most of the time it is
   * on screen, and with aria-live it would also be a stream of announcements.
   */
  const messageCount = React.useMemo(() => {
    const length = formData.message.trim().length;
    const tooShort = length > 0 && length < LIMITS.message.min;
    const remaining = LIMITS.message.max - length;
    if (tooShort) {
      const needed = LIMITS.message.min - length;
      return {
        tooShort,
        tooLong: false,
        label: `${needed} more character${needed === 1 ? '' : 's'}`,
      };
    }
    if (remaining <= 100) {
      return { tooShort: false, tooLong: remaining <= 0, label: `${remaining} left` };
    }
    return { tooShort: false, tooLong: false, label: '' };
  }, [formData.message]);

  // Pre-fills the visitor's own mail client with what they already typed, so the fallback
  // costs them a click rather than retyping the message. encodeURIComponent is load-bearing
  // in both fields: an unencoded `&` or `?` in the body would otherwise terminate it and be
  // read as further mailto headers.
  const mailtoFallback = React.useMemo(() => {
    const subject = encodeURIComponent(
      formData.name ? `Portfolio enquiry from ${formData.name}` : 'Portfolio enquiry'
    );
    const body = encodeURIComponent(formData.message);
    return `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  }, [formData.name, formData.message]);

  // `focus:outline-none` used to be here, replacing index.css's 2px brand-400
  // outline with a 1px ring at 40% opacity. That was the only outline-none in the
  // codebase, and it downgraded the focus indicator on the one part of the page
  // where keyboard focus matters most — a form you fill in field by field. The
  // border and background shift stay as the on-brand part of the treatment; the
  // global ring now sits on top of them where it belongs, so these controls look
  // focused the same way every other control on the site does.
  const fieldClass =
    'w-full rounded-xl border border-hairline bg-surface-2 px-4 py-3 text-slate-100 placeholder:text-slate-600 transition-colors focus:border-brand-500/60 focus:bg-surface disabled:opacity-50';

  return (
    <section
      id='contact'
      className={`section-padding relative overflow-hidden ${sectionAccent('brand')} bg-ink`}
    >
      {/* soft glow behind the form */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute left-1/2 top-1/4 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full opacity-60'
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 60%)' }}
      />

      <div className='container-custom relative z-10'>
        <SectionHeader
          innerRef={ref}
          inView={inView}
          number='06'
          label='Contact'
          accent='brand'
          size='major'
          title={
            <>
              Let&apos;s <span className='gradient-text'>work</span> together
            </>
          }
        >
          <p className='mt-4 text-lg leading-relaxed text-slate-400'>
            Have a project, a performance problem, or just want to talk shop? Drop me a line.
          </p>
        </SectionHeader>

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
                className='group card-surface card-lift flex items-start gap-4 p-5'
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
                  ref={statusRef}
                  tabIndex={-1}
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

              {submitStatus === 'invalid' && (
                <div
                  ref={statusRef}
                  tabIndex={-1}
                  role='alert'
                  className='flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4'
                >
                  <AlertTriangle size={18} className='mt-0.5 shrink-0 text-red-400' />
                  <div>
                    <p className='text-sm font-medium text-red-300'>
                      Couldn&apos;t send your message. Please check:
                    </p>
                    {/* Interpolated from LIMIT_HINTS, not typed out. These bullets
                        previously hardcoded "2–100" and "10–1000" next to inputs
                        that enforced neither, which is how the copy came to
                        describe rules the form did not apply. */}
                    <ul className='mt-1 list-inside list-disc text-sm text-slate-400'>
                      <li>Name: {LIMIT_HINTS.name}</li>
                      <li>Email: {LIMIT_HINTS.email}</li>
                      <li>Message: {LIMIT_HINTS.message}</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Delivery failed and re-submitting won't help, so the only useful thing to
                  offer is a route that doesn't depend on this API. The form keeps its
                  contents; the mailto carries them across so nothing has to be retyped. */}
              {submitStatus === 'failed' && (
                <div
                  ref={statusRef}
                  tabIndex={-1}
                  role='alert'
                  className='flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4'
                >
                  <AlertTriangle size={18} className='mt-0.5 shrink-0 text-amber-400' />
                  <div className='min-w-0'>
                    <p className='text-sm font-medium text-amber-200'>
                      Your message wasn&apos;t sent.
                    </p>
                    <p className='mt-1 text-sm text-slate-400'>
                      Something went wrong on my end — your text is still here, and nothing reached
                      me. Email me directly instead:
                    </p>
                    <a
                      href={mailtoFallback}
                      className='mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-100 transition-colors hover:border-amber-400/60 hover:bg-amber-500/20'
                    >
                      <Mail size={15} />
                      {EMAIL}
                    </a>
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
                  minLength={LIMITS.name.min}
                  maxLength={LIMITS.name.max}
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
                  maxLength={LIMITS.email.max}
                  disabled={isSubmitting}
                  autoComplete='email'
                />
              </div>

              <div>
                <div className='mb-2 flex items-baseline justify-between gap-3'>
                  <label
                    htmlFor='contact-message'
                    className='block font-mono text-xs uppercase tracking-wider text-slate-400'
                  >
                    Message
                  </label>
                  {/*
                    A live count, because maxLength enforces the ceiling silently:
                    the browser simply stops accepting characters, which reads as a
                    broken keyboard if you don't know why. This says what the limit
                    is and how close you are.

                    aria-live='polite' with a coarse update: announcing every
                    keystroke would make the field unusable with a screen reader, so
                    the text only changes identity at the two moments that matter —
                    crossing the minimum, and nearing the ceiling.
                  */}
                  <span
                    aria-live='polite'
                    className={`font-mono text-xs tabular-nums ${
                      messageCount.tooLong || messageCount.tooShort
                        ? 'text-amber-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {messageCount.label}
                  </span>
                </div>
                <textarea
                  id='contact-message'
                  name='message'
                  value={formData.message}
                  onChange={handleChange}
                  placeholder='Tell me about your project or idea…'
                  rows={5}
                  className={`${fieldClass} resize-none`}
                  required
                  minLength={LIMITS.message.min}
                  maxLength={LIMITS.message.max}
                  aria-describedby='contact-message-hint'
                  disabled={isSubmitting}
                />
                <p id='contact-message-hint' className='mt-2 text-xs text-slate-600'>
                  {LIMIT_HINTS.message}.
                </p>
              </div>

              <motion.button
                ref={submitButtonRef}
                type='submit'
                disabled={isSubmitting}
                /* No aria-label deliberately. The visible text already *is* the
                   accessible name (the icon is aria-hidden), so the label would
                   be a second copy that has to be kept in sync — and it wasn't:
                   the text swaps to "Sending…" while a static label would still
                   read "Send message", which is the WCAG 2.5.3 mismatch all over
                   again. Letting the content name the button makes that
                   impossible by construction. */
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
