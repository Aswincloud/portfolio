/**
 * @file TermsConditions.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Terms & Conditions page covering site use, IP, contact form, and disclaimers
 */

import React from 'react';
import { Link } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div className='mt-8'>
    <h2 className='text-xl font-semibold mb-3 text-white'>{title}</h2>
    <div className='text-slate-400 leading-relaxed space-y-3'>{children}</div>
  </div>
);

const TermsConditions = () => (
  <div className='min-h-screen bg-ink py-24 px-4 sm:px-6'>
    <div className='max-w-3xl mx-auto card-surface p-6 sm:p-8'>
      <h1 className='text-3xl font-bold mb-2 text-white'>Terms &amp; Conditions</h1>
      <p className='text-sm text-slate-400 mb-6'>Last updated: May 26, 2026</p>

      <p className='text-slate-400 leading-relaxed'>
        These terms govern your use of <span className='font-medium'>aswincloud.com</span> (the
        &quot;site&quot;), a personal portfolio operated by Aswin (&quot;I&quot;, &quot;me&quot;).
        By using the site you agree to the terms below. If you do not agree, please do not use the
        site.
      </p>

      <Section title='1. Acceptance of terms'>
        <p>
          Accessing or browsing the site, submitting the contact form, or interacting with any
          feature provided here constitutes acceptance of these terms and the{' '}
          <Link
            to='/privacy'
            viewTransition
            className='text-brand-300 underline transition-colors hover:text-brand-200'
          >
            Privacy Policy
          </Link>
          . These terms may be updated from time to time; the &quot;Last updated&quot; date above
          will always reflect the most recent revision. Continued use of the site after a change
          means you accept the revised terms.
        </p>
      </Section>

      <Section title='2. Intellectual property'>
        <p>
          Unless stated otherwise, the written content, design, and images on this site are © Aswin
          and are made available for personal reading and reference only. You may link to pages on
          this site freely.
        </p>
        <p>
          You may not copy, reproduce, redistribute, or repurpose the content for commercial use,
          for training machine-learning models, or as part of another portfolio or résumé, without
          prior written permission.
        </p>
        <p>
          The source code for this site is published on{' '}
          <a
            href='https://github.com/Aswincloud/portfolio'
            target='_blank'
            rel='noopener noreferrer'
            className='text-brand-300 underline transition-colors hover:text-brand-200'
          >
            GitHub
          </a>{' '}
          and is licensed under the terms stated in that repository. Third-party libraries used by
          the site retain their own licenses.
        </p>
        <p>
          Logos and company names referenced on the site (e.g.{' '}
          <span className='font-medium'>MulticoreWare</span>,{' '}
          <span className='font-medium'>Lenovo</span>,{' '}
          <span className='font-medium'>Tenstorrent</span>) are the property of their respective
          owners and are used here for identification only.
        </p>
      </Section>

      <Section title='3. Use of the contact form'>
        <p>By submitting a message through the contact form you confirm that:</p>
        <ul className='list-disc pl-6 space-y-1'>
          <li>The information you provide (name, email, message) is accurate.</li>
          <li>You are over the age of 13.</li>
          <li>
            You are not submitting spam, marketing solicitations, malware, phishing attempts, or
            content that is unlawful, threatening, defamatory, or infringes another party&apos;s
            rights.
          </li>
        </ul>
        <p>
          Submissions are forwarded to me by email via Resend; see the{' '}
          <Link
            to='/privacy'
            viewTransition
            className='text-brand-300 underline transition-colors hover:text-brand-200'
          >
            Privacy Policy
          </Link>{' '}
          for how that data is handled. I may decline to respond to any message, and I may block
          senders who abuse the form.
        </p>
      </Section>

      <Section title='4. Third-party links and services'>
        <p>
          The site links to external services, projects, and articles &mdash; for example GitHub,
          LinkedIn, the TTNN Eltwise Performance dashboard, and Telegram bots. I do not control
          these third parties and I am not responsible for their content, terms, or privacy
          practices. Visiting them is at your own discretion.
        </p>
      </Section>

      <Section title='5. Accuracy of information'>
        <p>
          The site describes projects, experience, and technical work in good faith. Specifics such
          as performance numbers, dates, and project status can change; I do not warrant that every
          detail is current or error-free at every moment. If you spot a mistake, please let me know
          at{' '}
          <a
            href='mailto:contact@aswincloud.com'
            className='text-brand-300 underline transition-colors hover:text-brand-200'
          >
            contact@aswincloud.com
          </a>
          .
        </p>
      </Section>

      <Section title='6. Disclaimer of warranty'>
        <p>
          The site and all content are provided on an &quot;as is&quot; and &quot;as available&quot;
          basis, without warranties of any kind, express or implied &mdash; including but not
          limited to warranties of merchantability, fitness for a particular purpose,
          non-infringement, or uninterrupted availability. Code snippets, technical opinions, and
          recommendations on this site are personal and do not constitute professional advice.
        </p>
      </Section>

      <Section title='7. Limitation of liability'>
        <p>
          To the maximum extent permitted by law, in no event will I be liable for any indirect,
          incidental, special, consequential, or punitive damages &mdash; including loss of profits,
          data, or goodwill &mdash; arising from your use of, or inability to use, the site or any
          content linked from it. My total liability for any claim related to the site is limited to
          the greater of (a) the amount you paid me to use the site (typically zero) or (b) INR
          1,000.
        </p>
      </Section>

      <Section title='8. Indemnity'>
        <p>
          You agree to indemnify and hold me harmless from any claims, damages, or expenses
          (including reasonable legal fees) arising from your misuse of the site, your violation of
          these terms, or your infringement of any third-party right.
        </p>
      </Section>

      <Section title='9. Termination'>
        <p>
          I may suspend or remove access to the site, or any feature on it, at any time and without
          prior notice. Sections that by their nature should survive termination (intellectual
          property, disclaimers, limitation of liability, indemnity, governing law) will continue to
          apply.
        </p>
      </Section>

      <Section title='10. Governing law'>
        <p>
          These terms are governed by the laws of India. Any dispute arising out of or in connection
          with the site or these terms will be subject to the exclusive jurisdiction of the courts
          of Pondicherry, India.
        </p>
      </Section>

      <Section title='11. Contact'>
        <p>
          For questions about these terms, email{' '}
          <a
            href='mailto:contact@aswincloud.com'
            className='text-brand-300 underline transition-colors hover:text-brand-200'
          >
            contact@aswincloud.com
          </a>
          .
        </p>
      </Section>

      <p className='mt-10 text-sm text-slate-400'>
        See also:{' '}
        <Link
          to='/privacy'
          viewTransition
          className='text-brand-300 underline transition-colors hover:text-brand-200'
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  </div>
);

export default TermsConditions;
