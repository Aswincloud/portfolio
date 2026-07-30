// Security headers for responses this Worker generates.
//
// Scope note: with `run_worker_first = ["/api/*"]` in wrangler.toml, this Worker only
// ever runs for /api/*. Static assets (and the SPA fallback) are served directly by
// the assets runtime and get their headers from dist/_headers, generated at build time
// by scripts/vite-plugin-security-headers.js. A `_headers` file deliberately does not
// apply to Worker-generated responses, which is why these are declared separately.
//
// Everything here is a JSON API response — never a document — so the policy is
// maximally strict: 'none' throughout means even a response mislabelled with an HTML
// content type cannot execute or fetch anything.
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Attach the security headers above to a Response, in place.
function withSecurityHeaders(response) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

// Origins allowed to call the API from a browser. The form is served from the same
// origin, so it needs no CORS grant at all; this list exists only so the preview
// deployments keep working. Anything else gets no Access-Control-Allow-Origin, which
// is what stops third-party pages from POSTing through a visitor's browser.
export const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/(www\.)?aswincloud\.com$/,
  /^https:\/\/[a-z0-9-]+\.aswin-portfolio\.workers\.dev$/,
  /^https:\/\/aswin-portfolio\.workers\.dev$/,
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

// Contact form limits. Kept here so validation and the tests agree on one source.
export const LIMITS = {
  name: { min: 2, max: 100 },
  message: { min: 10, max: 1000 },
  email: { max: 254 }, // RFC 5321 maximum forward-path length
};

// Email validation function
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Escape text for interpolation into HTML.
 *
 * Visitor-supplied name/email/message are pasted straight into the notification and
 * auto-reply email bodies. Without escaping, a message containing markup becomes live
 * HTML in the mail client — at best it mangles the email, at worst it forges content
 * (e.g. a fake "verified" banner or an <a> pointing somewhere else) in a message that
 * appears to come from this domain. The auto-reply is delivered to the address the
 * submitter chose, so this is reachable by anyone.
 */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Redact an email for logging: keeps enough to correlate reports without writing
 * visitors' addresses to the log retention window in plaintext.
 * `someone@example.com` → `s*****e@example.com`
 */
export function redactEmail(email) {
  const value = String(email ?? '');
  const at = value.lastIndexOf('@');
  if (at < 1) return '[redacted]';
  const local = value.slice(0, at);
  const domain = value.slice(at);
  if (local.length <= 2) return `${local[0]}*${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${local.at(-1)}${domain}`;
}

/**
 * Per-IP rate limit for the contact endpoint.
 *
 * Fails open: if the binding is missing (older deployment, `wrangler dev` without the
 * binding) the form keeps working rather than hard-failing for every visitor. A
 * contact form is not an auth endpoint, so availability wins over strictness here.
 *
 * Note Cloudflare's limiter is per-location and eventually consistent, so this raises
 * the cost of casual abuse rather than enforcing an exact global quota.
 */
async function isRateLimited(request, env) {
  const limiter = env.CONTACT_RATE_LIMIT;
  if (!limiter?.limit) {
    console.warn('⚠️ CONTACT_RATE_LIMIT binding unavailable — allowing request');
    return false;
  }
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  try {
    const { success } = await limiter.limit({ key: `contact:${ip}` });
    return !success;
  } catch (error) {
    console.error('⚠️ Rate limit check failed, allowing request:', error.message);
    return false;
  }
}

// HTML email template.
// Every interpolation below is escaped — see escapeHtml above for why.
export function createEmailHTML(rawName, rawEmail, rawMessage) {
  const name = escapeHtml(rawName);
  const email = escapeHtml(rawEmail);
  // href="mailto:…" is a URL context, not an HTML text context, so it needs
  // percent-encoding as well — escapeHtml alone would leave `?`/`&` able to inject
  // extra mailto headers (e.g. an attacker-chosen cc/bcc) into the reply link.
  const emailHref = escapeHtml(encodeURIComponent(rawEmail));
  // Escape first, then convert newlines, so the <br> we add survives but any markup
  // the visitor typed does not.
  const message = escapeHtml(rawMessage).replace(/\n/g, '<br>');
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #2563eb; text-align: center; margin-bottom: 30px;">
        📧 New Portfolio Contact Form Submission
      </h2>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin-top: 0;">Contact Details:</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${emailHref}" style="color: #2563eb;">${email}</a></p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h3 style="color: #374151; margin-top: 0;">Message:</h3>
        <p style="line-height: 1.6; color: #4b5563;">${message}</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          This email was sent from your portfolio contact form.
        </p>
        <a href="mailto:${emailHref}?subject=Re:%20Your%20portfolio%20inquiry"
           style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
          Reply to ${name}
        </a>
      </div>
    </div>
  `;
}

// Auto-reply email template.
// This one is delivered to the address the submitter supplied, so unescaped input here
// would let anyone forge HTML in a message sent from this domain.
export function createAutoReplyHTML(rawName, rawMessage) {
  const name = escapeHtml(rawName);
  // Truncate before escaping so the 100-char budget counts visitor characters rather
  // than entity expansions — escaping first could cut an entity in half (`&am`).
  const excerpt = String(rawMessage ?? '');
  const message = escapeHtml(excerpt.length > 100 ? `${excerpt.slice(0, 100)}...` : excerpt);
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #2563eb; text-align: center; margin-bottom: 30px;">
        🙏 Thank You for Reaching Out!
      </h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #374151;">Hi ${name},</p>
      
      <p style="font-size: 16px; line-height: 1.6; color: #374151;">
        Thank you for contacting me through my portfolio website. I have received your message and will get back to you as soon as possible, usually within 24-48 hours.
      </p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Your Message Summary:</h3>
        <p style="color: #6b7280; margin-bottom: 10px;"><strong>Submitted on:</strong> ${new Date().toLocaleString()}</p>
        <p style="color: #6b7280; font-style: italic;">"${message}"</p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.6; color: #374151;">
        In the meantime, feel free to check out my work on:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://github.com/Aswincloud"
           style="display: inline-block; background-color: #374151; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 0 10px;">
          GitHub
        </a>
        <a href="https://www.linkedin.com/in/aswin4122001/" 
           style="display: inline-block; background-color: #0077b5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 0 10px;">
          LinkedIn
        </a>
      </div>
      
      <p style="font-size: 16px; line-height: 1.6; color: #374151;">
        Best regards,<br>
        <strong>Aswin</strong><br>
        Software Engineer
      </p>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          This is an automated response. Please do not reply to this email directly.
        </p>
      </div>
    </div>
  `;
}

// Send email function using Resend API
//
// REQUIREMENTS:
// 1. Resend API key configured as environment variable
// 2. Domain verification in Resend dashboard (completed)
// 3. Proper error handling and logging
//
async function sendEmail(to, subject, html, text, hostname = 'aswincloud.com', env) {
  // `to` is the visitor's own address on the auto-reply, so every log line below
  // redacts it. See redactEmail for why.
  console.log('🚀 Starting email send process:', {
    to: redactEmail(to),
    subject,
    hostname,
    timestamp: new Date().toISOString(),
  });

  // Validate email format
  if (!isValidEmail(to)) {
    console.error('❌ Invalid email address:', redactEmail(to));
    throw new Error('Invalid email address');
  }

  console.log('✅ Email validation passed');

  // Check if we're in a preview environment
  if (hostname.includes('workers.dev')) {
    console.log('📧 Preview deployment - email would be sent:', {
      to: redactEmail(to),
      subject,
      from: 'contact@aswincloud.com',
      hostname,
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  console.log('🌐 Production environment detected, proceeding with Resend');

  try {
    console.log('🌐 Making request to Resend API...');

    // Resend API payload
    const resendPayload = {
      from: 'contact@aswincloud.com', // Now using your verified domain
      to: [to],
      subject: subject,
      html: html,
      text: text,
    };

    // Log shape, not contents: the payload embeds the visitor's address and their
    // whole message, and Workers logs are readable by anyone with dashboard access.
    console.log('📧 Resend payload prepared:', {
      from: resendPayload.from,
      to: redactEmail(to),
      subject,
      htmlLength: html.length,
      textLength: text.length,
    });

    // You'll need to add your Resend API key as a secret
    const RESEND_API_KEY = env.RESEND_API_KEY || 're_placeholder_key';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(resendPayload),
    });

    console.log('📡 Resend API response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resend API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });

      throw new Error(`Resend error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();

    console.log('✅ Email sent successfully via Resend:', {
      to: redactEmail(to),
      subject,
      id: responseData.id,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('❌ Failed to send email via Resend:', {
      error: error.message,
      stack: error.stack,
      to: redactEmail(to),
      subject,
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
}

/**
 * Resolve the Access-Control-Allow-Origin value for a request, or null when the
 * origin isn't one of ours.
 *
 * Returning null (rather than echoing the origin, or `*`) is the point: it makes the
 * browser drop the response, so a page on evil.example can't read what this API says
 * back. Same-origin form submissions send no Origin header on POST from our own page in
 * some browsers, and CORS isn't consulted at all when it's absent, so `null` here never
 * breaks the real form.
 */
export function resolveAllowedOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  return ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin)) ? origin : null;
}

// Helper function to add CORS headers to response
function addCorsHeaders(response, request, methods = 'GET, POST, OPTIONS') {
  const allowedOrigin = resolveAllowedOrigin(request);
  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Methods', methods);
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  // Vary regardless: the response body is identical but the CORS headers are not, so a
  // cache keyed without Origin could hand an allowed origin's headers to a denied one.
  response.headers.append('Vary', 'Origin');
  return response;
}

// Helper function to handle API routes
export async function handleApiRoutes(pathname, request, env) {
  if (pathname === '/api/contact' && request.method === 'POST') {
    const response = await handleContactForm(request, env);
    return addCorsHeaders(response, request, 'POST, OPTIONS');
  }

  if (pathname === '/api/health' && request.method === 'GET') {
    const response = new Response(
      JSON.stringify({
        status: 'OK',
        message: 'Portfolio backend is running on Cloudflare Workers',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return addCorsHeaders(response, request, 'GET, OPTIONS');
  }

  if (request.method === 'OPTIONS') {
    const response = new Response(null, { status: 204 });
    addCorsHeaders(response, request, 'GET, POST, OPTIONS');
    if (resolveAllowedOrigin(request)) {
      response.headers.set('Access-Control-Max-Age', '86400');
    }
    return response;
  }

  return null; // Not an API route
}

// JSON response helper — every branch below returns the same shape.
function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

// Handle contact form submission
export async function handleContactForm(request, env) {
  try {
    const payload = await request.json();
    // `raw*` names deliberately: these are attacker-controlled and of unknown type until
    // validated below, which rebinds the trimmed strings as `name`/`email`/`message`. The
    // naming is what stops a later edit from reaching past validation to the raw value.
    const { name: rawName, email: rawEmail, message: rawMessage, company } = payload;

    // Honeypot. `company` is rendered off-screen and left empty by real visitors; bots
    // that fill every field in the form give themselves away. Answer 200 with the normal
    // success body so the bot can't distinguish rejection from delivery and retry.
    if (typeof company === 'string' && company.trim() !== '') {
      // No IP and no user-agent. The honeypot is a heuristic, not proof of a bot: a
      // password manager or aggressive autofill can put a value in an off-screen field
      // that a real person never saw. Logging the address and device string of whoever
      // trips it writes visitor PII and a fingerprint into the log retention window —
      // the same thing this change removes from the success path — for someone who may
      // simply have been misclassified. The count is what's actionable; who it was is not.
      console.log('🍯 Honeypot triggered — dropping submission', {
        timestamp: new Date().toISOString(),
      });
      // Byte-identical to the real success response below, including `delivered` — a
      // shape difference here would be exactly the signal the honeypot exists to deny.
      return jsonResponse({
        success: true,
        delivered: true,
        message: 'Message sent successfully! Thank you for contacting me.',
      });
    }

    // Validate input.
    //
    // The type check is load-bearing, not defensive boilerplate: JSON gives the caller
    // free choice of type, and `!value` only rejects the falsy ones. A number, object or
    // array is truthy and has no useful `.length`, so `name: 12345` and `message: 42`
    // both read `.length === undefined`, and every `undefined < min` / `undefined > max`
    // comparison is false — the bounds below silently pass. `['a@b.co']` even satisfies
    // the email regex, because RegExp.test stringifies its argument.
    //
    // Trim first so the same value is validated, sent and stored: `'  a@b.co  '` fails
    // isValidEmail untrimmed (the regex forbids whitespace) while `'  ab  '` would pass
    // the name minimum on padding alone.
    if (
      typeof rawName !== 'string' ||
      typeof rawEmail !== 'string' ||
      typeof rawMessage !== 'string'
    ) {
      return jsonResponse({ success: false, message: 'All fields are required' }, 400);
    }

    // From here on these shadow the raw values, so every downstream use — the emails, the
    // log lengths, the Resend recipient — sees exactly what was validated.
    const name = rawName.trim();
    const email = rawEmail.trim();
    const message = rawMessage.trim();

    if (!name || !email || !message) {
      return jsonResponse({ success: false, message: 'All fields are required' }, 400);
    }

    if (!isValidEmail(email) || email.length > LIMITS.email.max) {
      return jsonResponse({ success: false, message: 'Invalid email address' }, 400);
    }

    if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) {
      return jsonResponse(
        {
          success: false,
          message: `Name must be between ${LIMITS.name.min} and ${LIMITS.name.max} characters`,
        },
        400
      );
    }

    if (message.length < LIMITS.message.min || message.length > LIMITS.message.max) {
      return jsonResponse(
        {
          success: false,
          message: `Message must be between ${LIMITS.message.min} and ${LIMITS.message.max} characters`,
        },
        400
      );
    }

    // Rate limit after validation so a flood of malformed requests doesn't consume a
    // legitimate visitor's quota, but before sending — the limit exists to cap outbound
    // email, which is the expensive and abusable part.
    if (await isRateLimited(request, env)) {
      // This one does keep the IP, unlike the honeypot above. Exceeding the limit is a
      // measured fact about this address rather than a guess about intent, and the address
      // is the only actionable output — it's what a WAF or firewall rule would be written
      // against. The limiter already holds it as its own key, so the log adds no new
      // category of data.
      console.warn('🚦 Rate limit exceeded for contact form', {
        ip: request.headers.get('CF-Connecting-IP') || 'unknown',
      });
      return jsonResponse(
        {
          success: false,
          message: 'Too many messages sent. Please try again in a minute.',
        },
        429,
        { 'Retry-After': '60' }
      );
    }

    // Send notification email to you
    const notificationHTML = createEmailHTML(name, email, message);
    const notificationText = `
      New Portfolio Contact Form Submission
      
      Name: ${name}
      Email: ${email}
      Date: ${new Date().toLocaleString()}
      
      Message:
      ${message}
      
      Reply to: ${email}
    `;

    // Send auto-reply to the user
    const autoReplyHTML = createAutoReplyHTML(name, message);
    const autoReplyText = `
      Hi ${name},
      
      Thank you for contacting me through my portfolio website. I have received your message and will get back to you as soon as possible, usually within 24-48 hours.
      
      Your message was submitted on: ${new Date().toLocaleString()}
      
      In the meantime, feel free to check out my work on GitHub (https://github.com/Aswincloud) or connect with me on LinkedIn (https://www.linkedin.com/in/aswin4122001/).
      
      Best regards,
      Aswin
      Software Engineer
      
      ---
      This is an automated response. Please do not reply to this email directly.
    `;

    // Send both emails via Resend.
    // The visitor's name, address and message are deliberately not logged — they are
    // already delivered by email, and Workers logs are a second, longer-lived copy of
    // personal data that nothing here needs.
    console.log('📨 Processing contact form submission:', {
      email: redactEmail(email),
      nameLength: name.length,
      messageLength: message.length,
      hostname: request.headers.get('host') || 'aswincloud.com',
      timestamp: new Date().toISOString(),
    });

    // allSettled, not all: the two sends are not equally important, so their outcomes
    // have to be inspected separately rather than collapsed into one rejection.
    const [notification, autoReply] = await Promise.allSettled([
      sendEmail(
        'contact@aswincloud.com',
        `New Portfolio Contact from ${name}`,
        notificationHTML,
        notificationText,
        request.headers.get('host') || 'aswincloud.com',
        env
      ),
      sendEmail(
        email,
        'Thank you for contacting me!',
        autoReplyHTML,
        autoReplyText,
        request.headers.get('host') || 'aswincloud.com',
        env
      ),
    ]);

    // The notification is the delivery. If it failed, the message reached nobody, and
    // the previous behaviour — logging the error and answering `success: true` anyway —
    // meant the visitor was told their message was sent when it had been dropped. They
    // had no reason to follow up, and no copy of what they wrote. Report the failure and
    // let the client offer the mailto fallback.
    if (notification.status === 'rejected') {
      console.error('❌ Notification email failed — submission not delivered:', {
        error: notification.reason?.message,
        autoReplyStatus: autoReply.status,
        email: redactEmail(email),
        timestamp: new Date().toISOString(),
      });
      return jsonResponse(
        {
          success: false,
          delivered: false,
          message:
            'Your message could not be delivered. Please email contact@aswincloud.com directly.',
        },
        502
      );
    }

    // The auto-reply is a courtesy to the visitor, so its failure is not theirs to act
    // on: the message did reach its destination. Saying "failed" here would be false and
    // would prompt a duplicate submission.
    if (autoReply.status === 'rejected') {
      console.warn('⚠️ Auto-reply failed but the notification was delivered:', {
        error: autoReply.reason?.message,
        email: redactEmail(email),
        timestamp: new Date().toISOString(),
      });
    } else {
      console.log('✅ Both emails sent successfully:', { timestamp: new Date().toISOString() });
    }

    return jsonResponse({
      success: true,
      delivered: true,
      message: 'Message sent successfully! Thank you for contacting me.',
    });
  } catch (error) {
    console.error('Error handling contact form:', error);
    return jsonResponse(
      { success: false, message: 'Failed to send message. Please try again later.' },
      500
    );
  }
}

// Main worker event handler
//
// `run_worker_first = ["/api/*"]` means only API requests reach this Worker; assets and
// the SPA fallback are handled by the assets runtime. Anything else arriving here is
// unexpected, so it is delegated to that runtime rather than reimplemented.
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith('/api/')) {
      const apiResponse = await handleApiRoutes(pathname, request, env);
      return withSecurityHeaders(apiResponse ?? new Response('Not Found', { status: 404 }));
    }

    // Defensive fallback: let the assets runtime serve it (it applies _headers).
    return env.ASSETS.fetch(request);
  },
};
