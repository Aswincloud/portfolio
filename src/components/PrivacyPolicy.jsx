/**
 * @file PrivacyPolicy.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Privacy policy component with comprehensive data protection information
 */

import React from 'react';
import { Link } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div className='mt-8'>
    <h2 className='text-xl font-semibold mb-3 text-white'>{title}</h2>
    <div className='text-slate-400 leading-relaxed space-y-3'>{children}</div>
  </div>
);

const PrivacyPolicy = () => (
  <div className='min-h-screen bg-ink py-24 px-4 sm:px-6'>
    <div className='max-w-3xl mx-auto card-surface p-6 sm:p-8'>
      <h1 className='text-3xl font-bold mb-2 text-white'>Privacy Policy</h1>
      <p className='text-sm text-slate-500 mb-6'>Last updated: May 26, 2026</p>

      <p className='text-slate-400 leading-relaxed'>
        This page explains what information is collected when you visit{' '}
        <span className='font-medium'>aswincloud.com</span>, how it is used, and the choices you
        have. This is a personal portfolio site operated by Aswin (&quot;I&quot;, &quot;me&quot;).
        If anything here is unclear, email{' '}
        <a
          href='mailto:contact@aswincloud.com'
          className='text-brand-300 underline transition-colors hover:text-brand-200'
        >
          contact@aswincloud.com
        </a>
        .
      </p>

      <Section title='Information collected'>
        <p>
          <span className='font-medium'>Contact form.</span> When you submit the contact form, the
          name, email address, and message you provide are sent to me by email. These fields are
          required for me to respond.
        </p>
        <p>
          <span className='font-medium'>Analytics.</span> The site uses Google Analytics (GA4) to
          measure traffic. This collects standard analytics signals such as pages viewed, referring
          URL, approximate location (country/region), device and browser type, and an anonymised
          identifier. IP addresses are not stored in a personally identifiable form.
        </p>
        <p>
          <span className='font-medium'>Hosting logs.</span> The site is served via Cloudflare. As
          part of normal operation, Cloudflare processes request metadata (IP address, user agent,
          timestamp) for delivery, caching, and security. I do not access or retain these logs
          beyond what Cloudflare provides.
        </p>
        <p>
          <span className='font-medium'>Local browser storage.</span> The site may write a small
          diagnostic record (key{' '}
          <code className='rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[13px] text-brand-200'>
            portfolio_errors
          </code>
          ) to your browser&apos;s{' '}
          <code className='rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[13px] text-brand-200'>
            localStorage
          </code>{' '}
          if a runtime error occurs. This stays on your device and is not transmitted anywhere.
        </p>
      </Section>

      <Section title='How the information is used'>
        <ul className='list-disc pl-6 space-y-1'>
          <li>To reply to messages sent through the contact form.</li>
          <li>
            To understand which pages and projects are read, so I can improve the content and
            structure of the site.
          </li>
          <li>To diagnose and fix bugs or performance issues.</li>
          <li>
            To detect and block abusive traffic (spam submissions, automated scraping, denial of
            service).
          </li>
        </ul>
        <p>
          Your information is not sold, rented, or shared for advertising. I do not run ads on this
          site and do not build profiles for marketing.
        </p>
      </Section>

      <Section title='Third-party services'>
        <p>The site relies on a small number of processors:</p>
        <ul className='list-disc pl-6 space-y-1'>
          <li>
            <span className='font-medium'>Cloudflare</span> &mdash; hosting, DNS, and edge delivery
            (
            <a
              href='https://www.cloudflare.com/privacypolicy/'
              target='_blank'
              rel='noopener noreferrer'
              className='text-brand-300 underline transition-colors hover:text-brand-200'
            >
              privacy policy
            </a>
            ).
          </li>
          <li>
            <span className='font-medium'>Resend</span> &mdash; transactional email delivery for
            contact-form submissions (
            <a
              href='https://resend.com/legal/privacy-policy'
              target='_blank'
              rel='noopener noreferrer'
              className='text-brand-300 underline transition-colors hover:text-brand-200'
            >
              privacy policy
            </a>
            ).
          </li>
          <li>
            <span className='font-medium'>Google Analytics</span> &mdash; aggregate traffic
            analytics (
            <a
              href='https://policies.google.com/privacy'
              target='_blank'
              rel='noopener noreferrer'
              className='text-brand-300 underline transition-colors hover:text-brand-200'
            >
              privacy policy
            </a>
            ).
          </li>
          <li>
            <span className='font-medium'>Google Fonts</span> &mdash; web font delivery. Fonts are
            fetched directly from Google&apos;s CDN when you load the site.
          </li>
        </ul>
      </Section>

      <Section title='Cookies and similar technologies'>
        <p>
          Google Analytics sets cookies (typically{' '}
          <code className='rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[13px] text-brand-200'>
            _ga
          </code>{' '}
          and{' '}
          <code className='rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[13px] text-brand-200'>
            _ga_*
          </code>
          ) used to distinguish unique visitors and sessions. No advertising or cross-site tracking
          cookies are set by this site.
        </p>
        <p>
          You can block analytics cookies via your browser&apos;s settings, a tracking-prevention
          extension, or by enabling &quot;Do Not Track&quot;. The rest of the site works normally
          without them.
        </p>
      </Section>

      <Section title='Data retention'>
        <ul className='list-disc pl-6 space-y-1'>
          <li>
            <span className='font-medium'>Contact form messages</span> are retained in my inbox
            until I no longer need them to maintain the conversation. You can ask me to delete a
            specific thread at any time.
          </li>
          <li>
            <span className='font-medium'>Analytics data</span> is retained according to the default
            Google Analytics retention window (currently 14 months for event-level data).
          </li>
          <li>
            <span className='font-medium'>Local diagnostic data</span> in your browser persists
            until you clear site data, which you can do at any time via your browser settings.
          </li>
        </ul>
      </Section>

      <Section title='Your rights'>
        <p>
          Depending on where you live, you may have rights under laws such as the GDPR, the UK GDPR,
          or India&apos;s DPDP Act &mdash; including the right to access, correct, or delete
          information that relates to you, and to object to certain processing.
        </p>
        <p>
          To exercise any of these rights, email{' '}
          <a
            href='mailto:contact@aswincloud.com'
            className='text-brand-300 underline transition-colors hover:text-brand-200'
          >
            contact@aswincloud.com
          </a>
          . I respond to requests within a reasonable time, generally under 30 days.
        </p>
      </Section>

      <Section title='Children'>
        <p>
          This site is not directed at children under 13, and information about children is not
          knowingly collected. If you believe a child has submitted information through the contact
          form, email me and I will delete it.
        </p>
      </Section>

      <Section title='Security'>
        <p>
          Reasonable technical safeguards are in place &mdash; HTTPS everywhere, secret keys held
          server-side, and minimum-necessary data collection. No website can guarantee absolute
          security; if you suspect a vulnerability, please report it to{' '}
          <a
            href='mailto:contact@aswincloud.com'
            className='text-brand-300 underline transition-colors hover:text-brand-200'
          >
            contact@aswincloud.com
          </a>
          .
        </p>
      </Section>

      <Section title='Changes to this policy'>
        <p>
          This policy may be updated occasionally to reflect changes in the site, the tools it uses,
          or applicable law. The &quot;Last updated&quot; date at the top of the page will always
          reflect the most recent revision. Material changes will be highlighted on the home page
          where reasonable.
        </p>
      </Section>

      <Section title='Contact'>
        <p>
          Questions, deletion requests, or anything else &mdash;{' '}
          <a
            href='mailto:contact@aswincloud.com'
            className='text-brand-300 underline transition-colors hover:text-brand-200'
          >
            contact@aswincloud.com
          </a>
          .
        </p>
      </Section>

      <p className='mt-10 text-sm text-slate-500'>
        See also:{' '}
        <Link
          to='/terms'
          className='text-brand-300 underline transition-colors hover:text-brand-200'
        >
          Terms &amp; Conditions
        </Link>
        .
      </p>
    </div>
  </div>
);

export default PrivacyPolicy;
